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
      m_dataResolution = null,
      m_currentQuery = null,
      m_currentBBox = null;

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

  var getCoursePoints = function(bbox, res, batch, clear, id, pointSize) {
    var errorString,
        pointUrl = '/services/floodmap',
        reader, geoJson;

    batch = typeof batch !== 'undefined' ? batch : 0;
    clear = typeof clear !== 'undefined' ? clear : false;
    id = typeof id !== 'undefined' ? id : null;

    $.get(pointUrl,
          {
            'id': id,
            'bbox': JSON.stringify(bbox),
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

            m_featureLayer.addData(geoJson, !clear, pointSize);
            m_featureLayer.redraw();
          }

          if (id == null) {
            m_currentQuery = response.result.id;
          }

          if (response.result.id === m_currentQuery && response.result.hasMore) {
            // TODO This should using setTimeout to prevent stackoverflow
            getCoursePoints(bbox, response.result.res, response.result.batch,
                            false, response.result.id, pointSize);
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


var Rectangle = function (x0, y0, x1, y1) {
  var m_ll = [x0, y0],
      m_tr = [x1, y1];

  this.lowerLeft = function() {
    return m_ll;
  };

  this.upperRight = function() {
    return m_tr;
  };

  this.getBoundingBox = function() {
    return [this.lowerLeft(), [this.lowerLeft()[0], this.upperRight()[1]],
            this.upperRight(), [this.upperRight()[0], this.lowerLeft()[1]],
            this.lowerLeft()]
  };
}

Rectangle.equal = function(a, b) {
  var equal = function(l1, l2) {
    return  l1[0] === l2[0] && l1[1] === l2[1];
  };

  return equal(a.lowerLeft(), b.lowerLeft()) && equal(a.upperRight, b.upperRight());
}

// [[x1, y1], [x2, y2]]
var intersection = function(a, b) {

    var aLeft, bLeft, aRight, bRight, aTop, bTop, aBottom, bBottom;

    aLeft = a[0][0];
    bLeft = b[0][0];

    aRight = a[1][0];
    bRight = b[1][0];

    aTop = a[1][1];
    bTop = b[1][1];

    aBottom = a[0][1];
    bBottom= b[0][1];

    var x0 = Math.max(aLeft, bLeft);
    var x1 = Math.min(aRight, bRight);

    if (x0 <= x1) {
      var y0 = Math.max(aBottom, bBottom);
      var y1 = Math.min(aTop, bTop);

      if (y0 <= y1) {
        return new Rectangle(x0, y0, x1, y1);
      }
    }

    return null;
  };

  ////////////////////////////////////////////////////////////////////////////
  /**
   * Return raw data
   */
  ////////////////////////////////////////////////////////////////////////////
  this.getData = function(time) {

    var start, end, delta, res, clippedBBox, pointSpriteSize;

    start = this.featureLayer().container().displayToMap(0, 0);
    end = this.featureLayer().container().displayToMap(5, 5);
    delta = end.x - start.x;
    res = selectResolution(delta);

    // Clip bounding box based on view extent
    start = this.featureLayer().container().displayToMap(0, $('#glcanvas').height())
    end = this.featureLayer().container().displayToMap($('#glcanvas').width(), 0);

    clippedBBox = intersection([[start.x, start.y], [end.x, end.y]],
                                [[m_bbox[0][0], m_bbox[0][1]], [m_bbox[2][0], m_bbox[2][1]]]);

    if (clippedBBox == null)
      clippedBBox = m_bbox;

    // Calculate point sprite size

    console.log("res: " + res);
    console.log("delta: " + delta);

    pointSpriteSize = 1.1 * (res/delta)*5;
    console.log("spriteSize: " + pointSpriteSize);


    this.featureLayer().setPointSpriteSize(pointSpriteSize);

    // If data resolution hasn't changed then just return
    if (m_dataResolution === res)
      return

    m_currentBBox = clippedBBox;
    m_dataResolution = res;

    clippedBBox = clippedBBox.getBoundingBox();
//
//    if (m_time === time) {
//      console.log('[info] No new data as timestamp has not changed.');
//      return m_resultCache;
//    }
//    m_time = time;

    var errorString = null;

    // TODO can we remove the size from this function
    getCoursePoints(clippedBBox, m_dataResolution, 0, true, null, pointSpriteSize);
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
