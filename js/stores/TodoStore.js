var AppDispatcher = require('../dispatcher/AppDispatcher');
var EventEmmiter = require('events').EventEmitter;
var TodoConstants = require("../constants/TodoConstants");
var assign = require('object-assign');

var CHANGE_EVENT = 'change';

var _todos = {};

/**
 * create Create a TODO item
 *
 * @param {string} text The content of the TODO item.
 */
function create(text) {
	//Hand-waving here. This should be where we typically set
	//server data, and use the server ID. Instead we just
	//randomize it based on time.
	var id = (+new Date() + Math.floor(Math.random() * 999999)).toString(36);

	_todos[id] = {
		id: id, 
		complete: false,
		text: text
	};
}


/**
 * update Update a TODO item
 *
 * @param id value to find todo item
 * @param updates values to update the todos with
 */
function update(id, updates) {
	_todos[id] = assign({}, _todos[id], updates);
}

/**
 * updateAll Update all the TODO items with the same object
 *
 * @param {object} updates An object literal containing only the data
 * to be updated
 */
function updateAll(updates) {
	for (var id in _todos) {
		update(id, updates);
	}
}

/**
 * destroy Delete a TODO item
 *
 * @param id Item to delete
 */
function destroy(id) {
	delete _todos[id]
}


/**
 * destroyAll Delete all TODO's
 *
 */
function destroyAll() {
	for (var id in _todos) {
		destroy(id);
	}
}

/**
 * destroyCompleted Delete all completed TODO items
 *
 */
function destroyCompleted() {
	for (var id in _todos){
		if (_todos[id].complete) {
			destroy(id);
		}
	}
}

var TodoStore = assign({}, EventEmitter.prototype, {

	/**
	 * areAllComplete Tests whether the remaining TODO's are marked as completed
	 *
	 */
	areAllComplete: function() {
		for (var id in _todos) {
			if (!_todos[id].complete){
				return false;
			}
		}
		return true;
	},

	/**
	 * getAll Get the Entire Collections of TODO's
	 *
	 * @return {object} Collections of TODO's
	 */
	getAll: function() {
		return _todos;
	},

	emitChange: function() {
		this.emit(CHANGE_EVENT);
	},

	addChangeListener: function(callback) {
		this.on(CHANGE_EVENT, callback);
	},

	removeChangeListener: function(callback) {
		this.removeListener(CHANGE_EVENT, callback);
	}

});

//Register callback to handle all updates
AppDispatcher.register(function(payload) {
	var text;
	var action = payload.action;

	switch(action.actionType) {
		case TodoConstants.TODO_CREATE:
			text = action.text.trim();
			if (text !== '') {
				create(text);
			}
			TodoStore.emitChange();
			break;

		case TodoConstants.TODO_TOGGLE_COMPLETE_ALL:
			if (TodoStore.areAllComplete()) {
				updateAll({ complete:false });
			} else {
				updateAll({ complete: true });
			}

			TodoStore.emitChange();
			break;

		case TodoConstants.TODO_UNDO_COMPLETE:
			update(action.id, { complete: false });
			TodoStore.emitChange();
			break;

		case TodoConstants.TODO_COMPLETE:
			update(action.id, { complete:true });
			TodoStore.emitChange();
			break;

		case TodoConstants.TODO_UPDATE_TEXT:
			text = action.text.trim();
			if (text !== '') {
				update(action.id, { text: text });
			}
			TodoStore.emitChange();
			break;

		case TodoConstants.TODO_DESTORY:
			destroy(action.id);
			TodoStore.emitChange();
			break;

		case TodoConstants.TODO_DESTORY_COMPLETED:
			destroyCompleted();
			TodoStore.emitChange();
			break;

		default:
			//no op
	}
});

module.exports = TodoStore;
