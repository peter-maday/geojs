//////////////////////////////////////////////////////////////////////////////
/**
 * Transform geometric data of a feature from source projection to destination
 * projection.
 *
 * @namespace
 */
//////////////////////////////////////////////////////////////////////////////
geo.transform = {};

//////////////////////////////////////////////////////////////////////////////
/**
 * Transform geometric data of a layer from source projection to destination
 * projection.
 */
//////////////////////////////////////////////////////////////////////////////
geo.transform.transformLayer = function (destGcs, layer, baseLayer) {
  "use strict";

  var features, count, i;

  if (!layer) {
    throw "Requires valid layer for tranformation";
  }

  if (!baseLayer) {
    throw "Requires baseLayer used by the map";
  }

  if (layer === baseLayer) {
    return;
  }

  if (layer instanceof geo.featureLayer) {
    features = layer.features();
    count = features.length;
    i = 0;

    for (i = 0; i < count; i += 1) {
      geo.transform.transformFeature(
        destGcs, features[i], true);
    }

    layer.gcs(destGcs);
  } else {
    throw "Only feature layer transformation is supported";
  }
};

//////////////////////////////////////////////////////////////////////////////
/**
 * Transform position coordinates from source projection to destination
 * projection.
 *
 * @param {string} srcGcs GCS of the coordinates
 * @param {string} destGcs Desired GCS of the transformed coordinates
 * @param {object} coordinates
 * @return {object|object[]} Transformed coordinates
 */
//////////////////////////////////////////////////////////////////////////////
geo.transform.transformCoordinates = function (srcGcs, destGcs, coordinates) {
  "use strict";


  var output, projPoint,
      projSrcGcs = new proj4.Proj(srcGcs),
      projDestGcs = new proj4.Proj(destGcs),
      arrayOfCoordinates, i, tmp;

  if (destGcs === srcGcs) {
    return coordinates;
  }

  /// TODO: Can we check for EPSG code?
  if (!destGcs || !srcGcs) {
    throw "Invalid source or destination GCS";
  }

  arrayOfCoordinates = Array.isArray(coordinates);

  if (arrayOfCoordinates && isFinite(coordinates[0])) {
    output = [];
    output.length = coordinates.length;
    for (i = 0; i < coordinates.length; i += 3) {
      tmp = geo.transform.transformCoordinates(
        srcGcs, destGcs, {
          x: coordinates[i],
          y: coordinates[i + 1],
          z: coordinates[i + 2]
        }
      );
      output[i] = tmp.x;
      output[i + 1] = tmp.y;
      output[i + 2] = tmp.z;
    }
    return output;
  }

  if (arrayOfCoordinates) {
    return coordinates.map(function (c) {
      return geo.transform.transformCoordinates(
        srcGcs,
        destGcs,
        c
      );
    });
  }

  projPoint = geo.util.normalizeCoordinates(coordinates);
  if (destGcs === "EPSG:3857" && srcGcs === "EPSG:4326") {
    /// Y goes from 0 (top edge is 85.0511 °N) to 2zoom − 1
    /// (bottom edge is 85.0511 °S) in a Mercator projection.

    projPoint.y = geo.mercator.lat2y(
      Math.min(Math.max(projPoint.y, -85.0511), 85.0511)
    );
    output = projPoint;
  } else {
    projPoint = new proj4.Point(projPoint.x, projPoint.y, projPoint.z);
    output = proj4.transform(projSrcGcs, projDestGcs, projPoint);
  }

  return output;
};
