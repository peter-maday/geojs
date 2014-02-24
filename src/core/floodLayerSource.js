//////////////////////////////////////////////////////////////////////////////
/**
 * @module ogs.geo
 */

/*jslint devel: true, forin: true, newcap: true, plusplus: true*/
/*jslint white: true, indent: 2*/

/*global geoModule, ogs, inherit, $, HTMLCanvasElement, Image*/
/*global vglModule, jQuery, document*/
//////////////////////////////////////////////////////////////////////////////

//////////////////////////////////////////////////////////////////////////////
/**
 * archiveLayerSource provides data to a layer
 *
 * onError function of the form:
 *
 *   function(String errorText)
 *
 * It allows the propgation of errors to the caller, so the user
 * can be provided with the appropriate error message.
 */
//////////////////////////////////////////////////////////////////////////////
geoModule.floodLayerSource = function(bbox) {
  'use strict';

  if (!(this instanceof geoModule.floodLayerSource) ) {
    return new geoModule.floodLayerSource(bbox);
  }
  geoModule.layerSource.call(this, 'dummy_id', 'flood', 'the path to nowhere');

  var m_time = -1,
      m_bbox = bbox,
      m_resultCache = null,
      m_featureLayer = null;

  ////////////////////////////////////////////////////////////////////////////
  /**
   * Get variable names for which source is producing the data
   *
   * @returns {String}
   */
  ////////////////////////////////////////////////////////////////////////////
  this.variableNames = function() {
    return "";
  };

  ////////////////////////////////////////////////////////////////////////////
  /**
   * Get result cache
   */
  ////////////////////////////////////////////////////////////////////////////
  this.resultCache = function () {
    return m_resultCache;
  };

  ////////////////////////////////////////////////////////////////////////////
  /**
   * PROTECTED Set result cache
   */
  ////////////////////////////////////////////////////////////////////////////
  this.p_setResultCache = function (resultCache) {
    m_resultCache = resultCache;
  };

  ////////////////////////////////////////////////////////////////////////////
  /**
   * Perform any clean at deletion
   */
  ////////////////////////////////////////////////////////////////////////////
  this.destroy = function () {
    m_resultCache = null;
  };

  this.setLayer = function(featureLayer) {
    m_featureLayer = featureLayer;
  };

  var getPoints = function(id) {
    var errorString,
        pointUrl = '/services/floodmap/' + id,
        reader, geoJson;
    $.get(pointUrl, function(response) {
        if (response.error !== null) {
          errorString = "[error] " + response.error ?
            response.error : "no results returned from server";
          console.log(errorString);
        } else {

          console.log("Starting to read GeoJSON")

          if (response.result.geoJson) {
            reader = vglModule.geojsonReader();
            geoJson = reader.readGJObject(response.result.geoJson);
            m_featureLayer.addData(geoJson);
          }

          if (response.result.hasMore) {
            setTimeout(function() {getPoints(id)}, 200);
          }
        }
      }, 'json');
  };

  ////////////////////////////////////////////////////////////////////////////
  /**
   * Return raw data
   */
  ////////////////////////////////////////////////////////////////////////////
  this.getData = function(time) {

    if (m_time === time) {
      console.log('[info] No new data as timestamp has not changed.');
      return m_resultCache;
    }
    m_time = time;

    var errorString = null;

    $.ajax({
      type: 'POST',
      url: '/services/floodmap',
      data: {
        bbox: JSON.stringify(m_bbox),
        rise: 20
      },
      dataType: 'json',
      success: function(response) {
        if (response.error !== null) {
          errorString = "[error] " + response.error ?
            response.error : "no results returned from server";
          console.log(errorString);
        } else {
          getPoints(response.result.id);
        }
      },
      error: function(jqXHR, textStatus, errorThrown ) {
        errorString = "Error reading: " + errorThrown;
        console.log(errorString);
      }
    });

    return null;
  };

  ////////////////////////////////////////////////////////////////////////////
  /**
   * Return metadata related to data
   */
   ////////////////////////////////////////////////////////////////////////////
  this.getMetaData = function(time) {
  };

  ////////////////////////////////////////////////////////////////////////////
  /**
   * Return spatial-range for the data
   * @returns {Array}
   */
  ////////////////////////////////////////////////////////////////////////////
  this.getSpatialRange = function(varname) {
    return [0, 0];
  };

  this.init();
  return this;
};

inherit(geoModule.floodLayerSource, geoModule.layerSource);
