//////////////////////////////////////////////////////////////////////////////
/**
 * @module geo
 */

/*jslint devel: true, forin: true, newcap: true, plusplus: true*/
/*jslint white: true, indent: 2*/

/*global geo, ogs, inherit, $, HTMLCanvasElement, Image*/
/*global vgl, document*/
//////////////////////////////////////////////////////////////////////////////

//////////////////////////////////////////////////////////////////////////////
/**
 * Create a new instance of latlng
 *
 * A latlng encapsulates geodesy coordinates defined by latitude and
 * longitude
 * @returns {geo.latlng}
 */
//////////////////////////////////////////////////////////////////////////////
geo.latlng = function(lat, lng) {
  "use strict";
  if (!(this instanceof geo.latlng)) {
    return new geo.latlng(lat, lng);
  }

  ////////////////////////////////////////////////////////////////////////////
  /**
   * @private
   */
  ////////////////////////////////////////////////////////////////////////////
  var m_lat = lat,
      m_lng = lng;

  ////////////////////////////////////////////////////////////////////////////
  /**
   * Return latitude
   */
  //////////////////////////////////////////////////////////////////////////////
  this.lat = function() {
    return m_lat;
  };

  ////////////////////////////////////////////////////////////////////////////
  /**
   * Return longitude
   */
  //////////////////////////////////////////////////////////////////////////////
  this.lng = function() {
    return m_lng;
  };

  ////////////////////////////////////////////////////////////////////////////
  /**
   * Return x coodinate
   */
  //////////////////////////////////////////////////////////////////////////////
  this.x = function() {
    return this.lng();
  };

  ////////////////////////////////////////////////////////////////////////////
  /**
   * Return y coodinate
   */
  //////////////////////////////////////////////////////////////////////////////
  this.y = function() {
    return this.lat();
  };

  return this;
};
