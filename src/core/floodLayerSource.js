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
geoModule.floodLayerSource = function() {
  'use strict';

  if (!(this instanceof geoModule.floodLayerSource) ) {
    return new geoModule.floodLayerSource();
  }
  geoModule.layerSource.call(this, 'dummy_id', 'flood', 'the path to nowhere');

  var m_time = -1,
      m_resultCache = null;

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

  ////////////////////////////////////////////////////////////////////////////
  /**
   * Return raw data
   */
  ////////////////////////////////////////////////////////////////////////////
  this.getData = function(time, callback) {

    if (m_time === time) {
      console.log('[info] No new data as timestamp has not changed.');
      return m_resultCache;
    }
    m_time = time;

    var asyncVal = false,
        retVal = [],
        errorString = null,
        reader = null;

    if (callback) {
      asyncVal = true;
    }

    $.ajax({
      type: 'POST',
      url: '/services/data/calculate/floodmap',
      data: {
        bb: null,
        seaLevelRise: null
      },
      dataType: 'json',
      async: asyncVal,
      success: function(response) {
        if (response.error !== null) {
          errorString = "[error] " + response.error ?
            response.error : "no results returned from server";
          console.log(errorString);
          m_onError(errorString);
        } else {
          reader = ogs.vgl.geojsonReader();
          retVal = reader.readGJObject(response.result.data);
        }
      },
      error: function(jqXHR, textStatus, errorThrown ) {
        errorString = "Error reading: " + errorThrown;
        console.log(errorString);
      }
    });

    if (callback) {
      callback(retVal);
    }
    m_resultCache = retVal;
    return retVal;
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
