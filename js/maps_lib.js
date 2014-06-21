/*!
 * Searchable Map Template with Google Fusion Tables
 * http://derekeder.com/searchable_map_template/
 *
 * Copyright 2012, Derek Eder
 * Licensed under the MIT license.
 * https://github.com/derekeder/FusionTable-Map-Template/wiki/License
 *
 * Date: 12/10/2012
 *
 */

// Enable the visual refresh
google.maps.visualRefresh = true;

var MapsLib = MapsLib || {};
var MapsLib = {

  //Setup section - put your Fusion Table details here
  //Using the v1 Fusion Tables API. See https://developers.google.com/fusiontables/docs/v1/migration_guide for more info

  //the encrypted Table ID of your Fusion Table (found under File => About)
  //NOTE: numeric IDs will be depricated soon
  fusionTableId:      "1DNhZumr1MfB6suD2nzJk77RNyuWYH2cualCUuHfe",

  //*New Fusion Tables Requirement* API key. found at https://code.google.com/apis/console/
  //*Important* this key is for demonstration purposes. please register your own.
  googleApiKey:       "AIzaSyATYmkCXslyubrTmuhoPZQ2mBhwgqnwZX0",

  //name of the location column in your Fusion Table.
  //NOTE: if your location column name has spaces in it, surround it with single quotes
  //example: locationColumn:     "'my location'",
  locationColumn:     "lat",

  map_centroid:       new google.maps.LatLng(48.8534100, 2.3488000), //center that your map defaults to
  locationScope:      "France",      //geographical area appended to all address searches
  recordName:         "result",       //for showing number of results
  recordNamePlural:   "results",

  searchRadius:       805,            //in meters ~ 1/2 mile
  defaultZoom:        11,             //zoom level when map is loaded (bigger is more zoomed in)
  addrMarkerImage:    'images/blue-pushpin.png',
  currentPinpoint:    null,

  initialize: function() {
    $( "#result_count" ).html("");

    geocoder = new google.maps.Geocoder();
    var myOptions = {
      zoom: MapsLib.defaultZoom,
      center: MapsLib.map_centroid,
      mapTypeId: google.maps.MapTypeId.ROADMAP
    };
    map = new google.maps.Map($("#map_canvas")[0],myOptions);

    // maintains map centerpoint for responsive design
    google.maps.event.addDomListener(map, 'idle', function() {
        MapsLib.calculateCenter();
    });

    google.maps.event.addDomListener(window, 'resize', function() {
        map.setCenter(MapsLib.map_centroid);
    });

    MapsLib.searchrecords = null;

    //reset filters
    $("#search_address").val(MapsLib.convertToPlainString($.address.parameter('address')));
    var loadRadius = MapsLib.convertToPlainString($.address.parameter('radius'));
    if (loadRadius != "") $("#search_radius").val(loadRadius);
    else $("#search_radius").val(MapsLib.searchRadius);
    $(":checkbox").prop("checked", "checked");
    $("#result_box").hide();

    //-----custom initializers-------

    //-----end of custom initializers-------

    //run the default search
    MapsLib.doSearch();

    $('.filter-box').click(function() {
      $(this).toggleClass('active');
    });



  },

  doSearch: function(location) {
    MapsLib.clearSearch();
    var address = $("#search_address").val();
    MapsLib.searchRadius = $("#search_radius").val();

    var whereClause = MapsLib.locationColumn + " not equal to ''";

    //-----custom filters-------

    var type_column_atm = "'atm'";
    var searchType_atm = type_column_atm + " IN (-1,";
    if ( $("#atm1").is(':checked')) searchType_atm += "1,";
    if ( $("#atm2").is(':checked')) searchType_atm += "2,";
    if ( $("#atm3").is(':checked')) searchType_atm += "3,";
    if ( $("#atm4").is(':checked')) searchType_atm += "4,";
    if ( $("#atm5").is(':checked')) searchType_atm += "5,";
    if ( $("#atm6").is(':checked')) searchType_atm += "6,";
    whereClause += " AND " + searchType_atm.slice(0, searchType_atm.length - 1) + ")";

    var type_column_lum = "'lum'";
    var searchType_lum = type_column_lum + " IN (-1,";
    if ( $("#lum1").is(':checked')) searchType_lum += "1,";
    if ( $("#lum2").is(':checked')) searchType_lum += "2, 3";
    if ( $("#lum3").is(':checked')) searchType_lum += "4,";
    if ( $("#lum4").is(':checked')) searchType_lum += "5,";
    whereClause += " AND " + searchType_lum.slice(0, searchType_lum.length - 1) + ")";


    var type_column_int = "'int'";
    var searchType_int = type_column_int + " IN (-1,";
    if ( $("#int1").is(':checked')) searchType_int += "1,";
    if ( $("#int2").is(':checked')) searchType_int += "2,";
    if ( $("#int3").is(':checked')) searchType_int += "3,";
    if ( $("#int4").is(':checked')) searchType_int += "4,";
    if ( $("#int5").is(':checked')) searchType_int += "6,";
    if ( $("#int6").is(':checked')) searchType_int += "8,";
    if ( $("#int7").is(':checked')) searchType_int += "5, 7, 9,";
    whereClause += " AND " + searchType_int.slice(0, searchType_int.length - 1) + ")";

    // var type_column_nbv = "'nbv'";
    // var searchType_nbv = type_column_nbv + " IN (-1,";
    // if ( $("#nbv1").is(':checked')) searchType_nbv += "1,";
    // if ( $("#nbv2").is(':checked')) searchType_nbv += "2,";
    // if ( $("#nbv3").is(':checked')) searchType_nbv += "3,";
    // if ( $("#nbv4").is(':checked')) searchType_nbv += "4,";
    // whereClause += " AND " + searchType_nbv.slice(0, searchType_nbv.length - 1) + ")";

    // var type_column_sex = "'sex'";
    // var searchType_sex = type_column_sex + " IN (-1,";
    // if ( $("#sex1").is(':checked')) searchType_sex += "0,";
    // if ( $("#sex2").is(':checked')) searchType_sex += "1,";
    // if ( $("#sex3").is(':checked')) searchType_sex += "2,";
    // whereClause += " AND " + searchType_sex.slice(0, searchType_sex.length - 1) + ")";


    //-------end of custom filters--------

    if (address != "") {
      if (address.toLowerCase().indexOf(MapsLib.locationScope) == -1)
        address = address + " " + MapsLib.locationScope;

      geocoder.geocode( { 'address': address}, function(results, status) {
        if (status == google.maps.GeocoderStatus.OK) {
          MapsLib.currentPinpoint = results[0].geometry.location;

          $.address.parameter('address', encodeURIComponent(address));
          $.address.parameter('radius', encodeURIComponent(MapsLib.searchRadius));
          map.setCenter(MapsLib.currentPinpoint);

          // set zoom level based on search radius
          if (MapsLib.searchRadius      >= 1610000) map.setZoom(04); // 1,000 miles
          else if (MapsLib.searchRadius >= 805000)  map.setZoom(05); // 500 miles
          else if (MapsLib.searchRadius >= 402500)  map.setZoom(06); // 250 miles
          else if (MapsLib.searchRadius >= 161000)  map.setZoom(07); // 100 miles
          else if (MapsLib.searchRadius >= 80500)   map.setZoom(08); // 50 miles
          else if (MapsLib.searchRadius >= 40250)   map.setZoom(09); // 25 miles
          else if (MapsLib.searchRadius >= 16100)   map.setZoom(11); // 10 miles
          else if (MapsLib.searchRadius >= 8050)    map.setZoom(12); // 5 miles
          else if (MapsLib.searchRadius >= 3220)    map.setZoom(13); // 2 miles
          else if (MapsLib.searchRadius >= 1610)    map.setZoom(14); // 1 mile
          else if (MapsLib.searchRadius >= 805)     map.setZoom(15); // 1/2 mile
          else if (MapsLib.searchRadius >= 400)     map.setZoom(16); // 1/4 mile
          else                                      map.setZoom(17);

          MapsLib.addrMarker = new google.maps.Marker({
            position: MapsLib.currentPinpoint,
            map: map,
            icon: MapsLib.addrMarkerImage,
            animation: google.maps.Animation.DROP,
            title:address
          });

          whereClause += " AND ST_INTERSECTS(" + MapsLib.locationColumn + ", CIRCLE(LATLNG" + MapsLib.currentPinpoint.toString() + "," + MapsLib.searchRadius + "))";

          MapsLib.drawSearchRadiusCircle(MapsLib.currentPinpoint);
          MapsLib.submitSearch(whereClause, map, MapsLib.currentPinpoint);
        }
        else {
          alert("We could not find your address: " + status);
        }
      });
    }
    else { //search without geocoding callback
      MapsLib.submitSearch(whereClause, map);
    }
  },

  submitSearch: function(whereClause, map, location) {
    //get using all filters
    //NOTE: styleId and templateId are recently added attributes to load custom marker styles and info windows
    //you can find your Ids inside the link generated by the 'Publish' option in Fusion Tables
    //for more details, see https://developers.google.com/fusiontables/docs/v1/using#WorkingStyles

    MapsLib.searchrecords = new google.maps.FusionTablesLayer({
      query: {
        from:   MapsLib.fusionTableId,
        select: MapsLib.locationColumn,
        where:  whereClause
      },
      styleId: 2,
      templateId: 2
    });
    MapsLib.searchrecords.setMap(map);
    MapsLib.getCount(whereClause);
  },

  clearSearch: function() {
    if (MapsLib.searchrecords != null)
      MapsLib.searchrecords.setMap(null);
    if (MapsLib.addrMarker != null)
      MapsLib.addrMarker.setMap(null);
    if (MapsLib.searchRadiusCircle != null)
      MapsLib.searchRadiusCircle.setMap(null);
  },

  findMe: function() {
    // Try W3C Geolocation (Preferred)
    var foundLocation;

    if(navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(function(position) {
        foundLocation = new google.maps.LatLng(position.coords.latitude,position.coords.longitude);
        MapsLib.addrFromLatLng(foundLocation);
      }, null);
    }
    else {
      alert("Sorry, we could not find your location.");
    }
  },

  addrFromLatLng: function(latLngPoint) {
    geocoder.geocode({'latLng': latLngPoint}, function(results, status) {
      if (status == google.maps.GeocoderStatus.OK) {
        if (results[1]) {
          $('#search_address').val(results[1].formatted_address);
          $('.hint').focus();
          MapsLib.doSearch();
        }
      } else {
        alert("Geocoder failed due to: " + status);
      }
    });
  },

  drawSearchRadiusCircle: function(point) {
      var circleOptions = {
        strokeColor: "#4b58a6",
        strokeOpacity: 0.3,
        strokeWeight: 1,
        fillColor: "#4b58a6",
        fillOpacity: 0.05,
        map: map,
        center: point,
        clickable: false,
        zIndex: -1,
        radius: parseInt(MapsLib.searchRadius)
      };
      MapsLib.searchRadiusCircle = new google.maps.Circle(circleOptions);
  },

  query: function(selectColumns, whereClause, groupBy, orderBy, callback) {
    var queryStr = [];
    queryStr.push("SELECT " + selectColumns);
    queryStr.push(" FROM " + MapsLib.fusionTableId);

    // where, group and order clauses are optional
    if (whereClause != "" && whereClause != null)
      queryStr.push(" WHERE " + whereClause);

    if (groupBy != "" && groupBy != null)
      queryStr.push(" GROUP BY " + groupBy);

     if (orderBy != "" && orderBy != null)
      queryStr.push(" ORDER BY " + orderBy);

    var sql = encodeURIComponent(queryStr.join(" "));
    $.ajax({url: "https://www.googleapis.com/fusiontables/v1/query?sql="+sql+"&callback="+callback+"&key="+MapsLib.googleApiKey, dataType: "jsonp"});
  },

  handleError: function(json) {
    if (json["error"] != undefined) {
      var error = json["error"]["errors"]
      console.log("Error in Fusion Table call!");
      for (var row in error) {
        console.log(" Domain: " + error[row]["domain"]);
        console.log(" Reason: " + error[row]["reason"]);
        console.log(" Message: " + error[row]["message"]);
      }
    }
  },

  getCount: function(whereClause) {
    var selectColumns = "Count()";
    MapsLib.query(selectColumns, whereClause, "", "", "MapsLib.displaySearchCount");
  },

  displaySearchCount: function(json) {
    MapsLib.handleError(json);
    var numRows = 0;
    if (json["rows"] != null)
      numRows = json["rows"][0];

    var name = MapsLib.recordNamePlural;
    if (numRows == 1)
    name = MapsLib.recordName;
    $( "#result_box" ).fadeOut(function() {
        $( "#result_count" ).html(MapsLib.addCommas(numRows) + " " + name + " found");
      });
    $( "#result_box" ).fadeIn();
  },

  addCommas: function(nStr) {
    nStr += '';
    x = nStr.split('.');
    x1 = x[0];
    x2 = x.length > 1 ? '.' + x[1] : '';
    var rgx = /(\d+)(\d{3})/;
    while (rgx.test(x1)) {
      x1 = x1.replace(rgx, '$1' + ',' + '$2');
    }
    return x1 + x2;
  },

  // maintains map centerpoint for responsive design
  calculateCenter: function() {
    center = map.getCenter();
  },

  //converts a slug or query string in to readable text
  convertToPlainString: function(text) {
    if (text == undefined) return '';
  	return decodeURIComponent(text);
  }

  //-----custom functions-------
  // NOTE: if you add custom functions, make sure to append each one with a comma, except for the last one.
  // This also applies to the convertToPlainString function above

  //-----end of custom functions-------
}
