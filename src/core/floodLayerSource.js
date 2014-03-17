//////////////////////////////////////////////////////////////////////////////
/**
 * @module ogs.geo
 */

/*jslint devel: true, forin: true, newcap: true, plusplus: true*/
/*jslint white: true, indent: 2*/

/*global geo, ogs, inherit, $, HTMLCanvasElement, Image*/
/*global vgl, jQuery, document*/
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
geo.floodLayerSource = function(bbox) {
  'use strict';

  if (!(this instanceof geo.floodLayerSource) ) {
    return new geo.floodLayerSource(bbox);
  }
  geo.layerSource.call(this, 'dummy_id', 'flood', 'the path to nowhere');

  var m_time = -1,
      m_bbox = bbox,
      m_resultCache = null,
      m_featureLayer = null,
      m_dataResolution = null;

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

  this.featureLayer = function() {
    return m_featureLayer;
  }

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
            reader = vgl.geojsonReader();
            geoJson = reader.readGJObject(response.result.geoJson);
            m_featureLayer.addData(geoJson, true);
            m_featureLayer.redraw();
          }

          if (response.result.hasMore) {
            getPoints(id);
          }
        }
      }, 'json');
  };

  var getCoursePoints = function(res, batch, clear) {
    var errorString,
        pointUrl = '/services/floodmap',
        reader, geoJson;

    batch = typeof batch !== 'undefined' ? batch : 0
    clear = typeof clear !== 'undefined' ? clear : false

    $.get(pointUrl,
          {
            bbox: JSON.stringify(m_bbox),
            rise: 20,
            'res': res,
            'batch': batch
          },
        function(response) {
        if (response.error !== null) {
          errorString = "[error] " + response.error ?
            response.error : "no results returned from server";
          console.log(errorString);
        } else {

          console.log("Starting to read GeoJSON")

          if (response.result.geoJson) {
            reader = vgl.geojsonReader();
            geoJson = reader.readGJObject(response.result.geoJson);

            m_featureLayer.addData(geoJson, !clear);
            m_featureLayer.redraw();
          }

          if (response.result.hasMore) {
            // TODO This should using setTimeout to prevent stackoverflow
            getCoursePoints(response.result.res, response.result.batch);
          }
        }
      }, 'json');
  };

  var resolutionTable  = [
                           {end: 0.6,      resolution: 0.1},
                           {end: 0.06,     resolution: 0.05},
                           {end: 0.035,    resolution: 0.025},
                           {end: 0.0225,   resolution: 0.0125},
                           {end: Number.MIN_VALUE, resolution: 0.008333}
                         ];

  var selectResolution  = function(delta) {
    var i, res, start, step;

    res = 0.1;
    start = Number.MAX_VALUE;

    for (i=0; i< resolutionTable.length; i++) {
      step = resolutionTable[i];

      if (delta <= start && delta >= step.end) {
        res = step.resolution;
        break;
      }
      start = step.end;
    }

    return res
  };

  ////////////////////////////////////////////////////////////////////////////
  /**
   * Return raw data
   */
  ////////////////////////////////////////////////////////////////////////////
  this.getData = function(time) {

    console.log("Checking zoom level")

    var start, end, delta, res;

    start = this.featureLayer().container().displayToMap(0, 0);
    end = this.featureLayer().container().displayToMap(5, 5);
    delta = end.x - start.x;
    res = selectResolution(delta);

    // If data resolution hasn't changed then just return
    if (m_dataResolution === res)
      return

    m_dataResolution = res
//
//    if (m_time === time) {
//      console.log('[info] No new data as timestamp has not changed.');
//      return m_resultCache;
//    }
//    m_time = time;

    var errorString = null;

    getCoursePoints(m_dataResolution, 0, true);
    return;

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

inherit(geo.floodLayerSource, geo.layerSource);
