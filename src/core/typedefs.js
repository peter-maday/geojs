/*
 * This file contains only type definitions for jsdoc.  There is
 * no actual code here.
 */

/**
 * General representation of rectangular bounds in world coordinates
 * @typedef geo.geoBounds
 * @type {object}
 * @property {geo.geoPosition} upperLeft Upper left corner
 * @property {geo.geoPosition} upperRight Upper right corner
 * @property {geo.geoPosition} lowerLeft Lower left corner
 * @property {geo.geoPosition} lowerRight Lower right corner
 */

/**
 * General representation of rectangular bounds in pixel coordinates
 * @typedef geo.screenBounds
 * @type {object}
 * @property {geo.screenPosition} upperLeft Upper left corner
 * @property {geo.screenPosition} upperRight Upper right corner
 * @property {geo.screenPosition} lowerLeft Lower left corner
 * @property {geo.screenPosition} lowerRight Lower right corner
 */

/**
 * General representation of a point on the screen.
 * @typedef geo.screenPosition
 * @type {object}
 * @property {Number} x Horizontal coordinate in pixels
 * @property {Number} y Vertical coordinate in pixels
 */

/**
 * General represention of a point on the earth.
 * @typedef geo.geoPosition
 * @type {object}
 * @property {Number} x Horizontal coordinate in degrees longitude
 * @property {Number} y Vertical coordinate in degrees latitude
 */

/**
 * The status of all mouse buttons.
 * @typedef geo.mouseButtons
 * @type {object}
 * @property {true|false} left The left mouse button
 * @property {true|false} right The right mouse button
 * @property {true|false} middle The middle mouse button
 */

/**
 * The status of all modifier keys these are copied from the
 * standard DOM events.
 * @typedef geo.modifierKeys
 * @type {object}
 * @property {true|false} alt <code>Event.alt</code>
 * @property {true|false} ctrl <code>Event.ctrl</code>
 * @property {true|false} shift <code>Event.shift</code>
 * @property {true|false} meta <code>Event.meta</code>
 */

/**
 * Provides information about the state of the mouse
 * @typedef geo.mouseState
 * @type {object}
 * @property {geo.screenPosition} page Mouse location in pixel space
 * @property {geo.geoPosition} map Mouse location in world space
 * @property {geo.mouseButtons} buttons The current state of the mouse buttons
 * @property {geo.modifierKeys} modifiers The current state of all modifier keys
 * @property {Date} time The timestamp the event took place
 * @property {Number} deltaTime The time in milliseconds since the last mouse event
 * @property {geo.screenPosition} velocity The velocity of the mouse pointer
 * in pixels per second
 */

/**
 * @typedef geo.brushSelection
 * @type {object}
 * @property {geo.screenBounds} display The selection bounds in pixel space
 * @property {geo.geoBounds} gcs The selection bounds in world space
 * @property {geo.mouseState} mouse The current mouse state
 * @property {geo.mouseState} origin The mouse state at the start of the
 * brush action
 */
