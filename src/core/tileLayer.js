//////////////////////////////////////////////////////////////////////////////
/**
 * @namespace geo
 */
//////////////////////////////////////////////////////////////////////////////

//////////////////////////////////////////////////////////////////////////////
/**
 * @class
 * An abstract class that defines general utilities for handling tiled
 * datasets.
 */
//////////////////////////////////////////////////////////////////////////////
geo.tileLayer = function (arg) {
  'use strict';

  if (!(this instanceof geo.tileLayer)) {
    return new geo.tileLayer(arg);
  }
  geo.featureLayer.call(this, arg);

  ////////////////////////////////////////////////////////////////////////////
  /**
   * Private member variables
   *
   * @private
   */
  ////////////////////////////////////////////////////////////////////////////
  var m_this = this,
      m_extent = {},
      m_tileSize = {width: 256, height: 256},
      m_cacheSize = 100,
      m_cache = {};

  ////////////////////////////////////////////////////////////////////////////
  /**
   * Get or set the map extents.  Takes an object with the following
   * properties representing the minimum/maximum coordinates in
   * each axis:
   *
   *   * left
   *   * right
   *   * top
   *   * bottom
   *   * minScale
   *   * maxScale
   *
   * @param {object?} arg The new extents
   * @return {object|this}
   */
  ////////////////////////////////////////////////////////////////////////////
  this.extent = function (arg) {
    if (arg === undefined) {
      return $.extend({}, m_extent);
    }
    $.extend(m_extent, arg);
    return m_this;
  };

  ////////////////////////////////////////////////////////////////////////////
  /**
   * Get or set the image cache size.
   *
   * @param {integer?} arg The new cache size
   * @return {integer|this}
   */
  ////////////////////////////////////////////////////////////////////////////
  this.cacheSize = function (arg) {
    if (arg === undefined) {
      return m_cacheSize;
    }
    m_cacheSize = arg;
    return m_this;
  };

  ////////////////////////////////////////////////////////////////////////////
  /**
   * Get or set the width and height in pixels of the tiles as an object
   * containing the following properties:
   *
   *   * width
   *   * height
   *
   * @param {object?} arg The new tile size
   * @return {object|this}
   */
  ////////////////////////////////////////////////////////////////////////////
  this.tileSize = function (arg) {
    if (arg === undefined) {
      return $.extend({}, m_tileSize);
    }
    $.extend(m_tileSize, arg);
    return m_this;
  };

  ////////////////////////////////////////////////////////////////////////////
  /**
   * Gives the optimal number of tiles to display at the current map size.
   * Accesses the size of the parent map object.
   * @return {object}
   */
  ////////////////////////////////////////////////////////////////////////////
  this.gridSize = function () {
    var mapSize = m_this.map().size(),
        tileSize = m_this.tileSize(),
        rows = Math.ceil(mapSize.height / tileSize.height),
        columns = Math.ceil(mapSize.width / tileSize.width);
    return {
      rows: rows,
      columns: columns,
      height: rows * tileSize.height,
      width: columns * tileSize.width
    };
  };

  ////////////////////////////////////////////////////////////////////////////
  /**
   * Removes cached tiles until the cache limit is satisfied.  Optionally
   * clear all of the cache if a truthy argument is provided.
   *
   * @TODO Implement
   * @param {bool?} clear Remove all of the cached tiles
   * @return {this}
   */
  ////////////////////////////////////////////////////////////////////////////
  this.cleanCache = function (/* clear */) {
    return m_this;
  };

  ////////////////////////////////////////////////////////////////////////////
  /**
   * Returns a unique string for each tileSpec.
   *
   * @private
   * @param {object} tileSpec Object giving the tile coordinates
   * @return {string}
   */
  ////////////////////////////////////////////////////////////////////////////
  function tileStr(tileSpec) {
    return tileSpec.x + '_' + tileSpec.y + '_' + tileSpec.z;
  }

  ////////////////////////////////////////////////////////////////////////////
  /**
   * Get a tile.  First tries the cache, then calls an abstract getter
   * to be implemented by the subclass instance.
   *
   * @param {object} tileSpec Object giving the tile coordinates
   * @param {function} done Callback giving the tile object
   * @return {this}
   */
  ////////////////////////////////////////////////////////////////////////////
  this.getTile = function (tileSpec, done) {
    var key = tileStr(tileSpec);

    if (m_cache.hasOwnProperty(key)) {
      if (m_cache[key].tile) {
        done(m_cache[key].tile);
      } else {
        m_cache[key].onload.push(done);
      }
    } else {
      m_cache[key] = {
        onload: []
      };
      m_this._getTile(tileSpec, function (tile) {
        m_cache[key] = {
          /* put extra data here like time stamps, hit rate, etc */
          tile: tile
        };
        m_cache[key].onload.forEach(function (d) {
          d(tile);
        });
        done(tile);
      });
    }
    m_this.cleanCache();
    return m_this;
  };

  return this;
};

inherit(geo.tileLayer, geo.featureLayer);
