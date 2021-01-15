"use strict";

      // Load the Visualization API and the columnchart package.
      google.load("visualization", "1", {
        packages: ["columnchart"]
      });

//TODO: 
//implement drag marker that resets to new location, fix polyline and altitude graph accordingly DONE
//UI to choose between manual input of coordinates or markers, general revamp and improvements KINDA DONE
//altitude difference with animated number countup/down DONE
//post in github pages NOT GONNA DO IT
//Optional: weather visibility on current day or later on KINDA DONE


//GLOBAL VARIABLES AND CONSTANTS
//
var buttonVisibility = document.getElementById("buttonVisibility");
buttonVisibility.addEventListener("click", parseLocationFromInputs, false);
var listOfMarkers = [];
var polylineBetweenCoordinates = null;
let map;


function initMap() {
  map = new google.maps.Map(document.getElementById("map"), {
    center: { lat: 43.553893, lng: -6.599182 },
    zoom: 12,
    mapTypeId: "terrain"
  });

    map.addListener('click', function(mapsMouseEvent) {
          var listaDeCoords = mapsMouseEvent.latLng.toString().split(",");
          var coordsFormatted = {lat: parseFloat(listaDeCoords[0].substring(1))};
          coordsFormatted.lng = parseFloat(listaDeCoords[1].substring(-1));
          var iconForMarker = "iconMarker.png";
          var newMarker = new google.maps.Marker({position: coordsFormatted, map:map, icon: iconForMarker, draggable: true, animation: google.maps.Animation.DROP});
          google.maps.event.addListener(newMarker, 'dragend', function() {
            updateElevationAndLineOnDrag();
          });
          addNewMarker(newMarker);
        });
}


function updateElevationAndLineOnDrag(){
  if (listOfMarkers.length < 2){
    return;
  }else{
    var pathToFollow = [listOfMarkers[0].position,  listOfMarkers[1].position]
    getElevationAndDrawLine(pathToFollow);
  }
}




function addNewMarker(markerToAdd){
  if (listOfMarkers.includes(markerToAdd) || listOfMarkers.length < 2){
    listOfMarkers.unshift(markerToAdd);
    //∫console.log("new marker added, no other changes");
  }
  else{
    //console.log("removed element from marker array");
    listOfMarkers[listOfMarkers.length-1].setMap(null);
    listOfMarkers.splice(-1,1);
    listOfMarkers.unshift(markerToAdd);
    
  }
    if(listOfMarkers.length == 2){
        var pathToFollow = [listOfMarkers[0].position,  listOfMarkers[1].position]
        getElevationAndDrawLine(pathToFollow);
        getDistanceAndAnimate();
        getWeatherForCoordinates();
    }
}


function parseLocationFromInputs(){
	var latitudeInit = document.getElementById("initialLat").value;
	var longitudeInit = document.getElementById("initialLong").value;
	var latitudeEnd = document.getElementById("finalLat").value;
	var longitudeEnd = document.getElementById("finalLong").value;

	var initialCoordinates = {lat: parseFloat(latitudeInit), lng: parseFloat(longitudeInit)};

	map = new google.maps.Map(document.getElementById("map"), {
    center: initialCoordinates,
    zoom: 8,
    mapTypeId: "terrain"
  });

	var imageForMarker = "first.png";
	var initialMarker = new google.maps.Marker({position: initialCoordinates, icon: imageForMarker, map: map, draggable: true, animation: google.maps.Animation.DROP});


	var finalCoordinates = {lat: parseFloat(latitudeEnd), lng: parseFloat(longitudeEnd)};

	var finalMarker = new google.maps.Marker({position: finalCoordinates, icon: imageForMarker, map:map, draggable: true, animation: google.maps.Animation.DROP});


  var pathOfVisibility = [initialCoordinates,finalCoordinates];

  getElevationAndDrawLine(pathOfVisibility);
  getDistanceAndAnimate();
  getWeatherForCoordinates();
}

  function getElevationAndDrawLine(pathOfVisibility){
  if (polylineBetweenCoordinates != null){
  polylineBetweenCoordinates.setMap(null);
}
	pathOfVisibility = pathOfVisibility.reverse();
  const elevator = new google.maps.ElevationService(); // Draw the path, using the Visualization API and the Elevation service.

  elevator.getElevationAlongPath(
    {
      path: pathOfVisibility,
      samples: 100
    }, plotElevation
  );

	polylineBetweenCoordinates = new google.maps.Polyline({
    path: pathOfVisibility,
    geodesic: true,
    strokeColor: '#130f40',
    strokeOpacity: 1.0,
    strokeWeight: 2
  });

polylineBetweenCoordinates.setMap(map);
requestElevation();
}

function getDistanceAndAnimate(){
  var positionFirstMarker = listOfMarkers[0].getPosition();
var positionSecondMarker = listOfMarkers[1].getPosition();
var distance = google.maps.geometry.spherical.computeDistanceBetween(positionFirstMarker, positionSecondMarker);
animateDistance(distance);
}


//AJAX REQUEST FOR ELEVATION
function requestElevation(){$.ajax({
  url: "https://maps.googleapis.com/maps/api/elevation/json?locations=39.7391536,-104.9847034&key=AIzaSyA1sJvxxEwh7BU40WeRf6jPDKdBoyi0gQA",
  context: document.body
}).done(function(data) {
  //console.log(data);
  return;
});
}



function plotElevation(elevations, status) {
		$("#altChart").text("Altitude chart");
        animateElevationDifference(elevations[1], elevations[elevations.length-1]);
        const chartDiv = document.getElementById("elevation_chart");

        if (status !== "OK") {
          // Show the error code inside the chartDiv.
          chartDiv.innerHTML =
            "Cannot show elevation: request failed because " + status;
          return;
        } // Create a new chart in the elevation_chart DIV.

        const chart = new google.visualization.ColumnChart(chartDiv); // Extract the data from which to populate the chart.
        // Because the samples are equidistant, the 'Sample'
        // column here does double duty as distance along the
        // X axis.

        const data = new google.visualization.DataTable();
        data.addColumn("string", "Sample");
        data.addColumn("number", "Elevation");

        for (let i = 0; i < elevations.length; i++) {
          data.addRow(["", elevations[i].elevation]);
        } // Draw the chart using the data within its DIV.

        chart.draw(data, {
          height: 150,
          legend: "none",
          titleY: "Elevation (m)",
          colors: "#82ccdd"
        });
      }


function animateElevationDifference(firstElevation, secondElevation){
  $("h3#firstElevation").text(Math.trunc(firstElevation.elevation));
  $("h3#secondElevation").text(Math.trunc(secondElevation.elevation));
  var difference = Math.trunc(firstElevation.elevation) - Math.trunc(secondElevation.elevation);
  $("h1#differenceInElevation").text(difference);

  if(difference > 0){
    $("h1#differenceInElevation").css("color", "#485460");
  }else{
    $("h1#differenceInElevation").css("color", "#ffa801");
  }

  var options = {
    useEasing: true,
    useGrouping: true,
    separator: ".",
    decimal: ",",
    suffix: " meters difference"
  };

  var counterOfDifference = new CountUp("differenceInElevation", 0, $("#differenceInElevation").text(), 0, 2, options);
  if(!counterOfDifference.error){
    counterOfDifference.start();
  }
}


function animateDistance(distance){
  $("h1#distanceText").text(distance);

  var options = {
    useEasing: true,
    useGrouping: true,
    separator: ".",
    decimal: ",",
    prefix: "Distance: ",
    suffix: " metres"
  };


  var counterOfDifference = new CountUp("distanceText", 0, $("#distanceText").text(), 0, 1, options);
  if(!counterOfDifference.error){
    counterOfDifference.start();
  }
}


function getWeatherForCoordinates(){
  var latForWeather = Math.round(listOfMarkers[0].getPosition().lat() * 100) / 100;
  var longForWeather = Math.round(listOfMarkers[0].getPosition().lng() *100) /100;
  var urlForCall = "http://api.openweathermap.org/data/2.5/weather?lat=" + latForWeather + "&lon="+ longForWeather + "&units=metric&appid=2d5819ca15d180ff87d29bf158a205b8";
  console.log(urlForCall);
  $.ajax({
  url: urlForCall,
  context: document.body
}).done(function(data) {
  console.log(data);
  displayWeatherInformation(data);
});
}

function  displayWeatherInformation(data){
  $("h3#nameLocationWeather").text(data.name);
  $("h3#weatherTitle").text(data.weather[0].description);
  $("h3#temperatureText").text(data.main.temp + "°C");
}




 //api.openweathermap.org/data/2.5/weather?lat={}&lon={}&appid={2d5819ca15d180ff87d29bf158a205b8}

