'use strict';

// Load Environment Variables from the .env file
require('dotenv').config();

// Application Dependencies
const express = require('express');
const superagent = require('superagent');
const cors = require('cors');

// Application Setup
const PORT = process.env.PORT;
const app = express();
app.use(cors());

let locations = {};

// Route Definitions
app.get('/location', locationHandler);
app.get('/weather', weatherHandler);
app.use('*', notFoundHandler);
app.use(errorHandler);


function locationHandler(request,response) {
  const url = `https://maps.googleapis.com/maps/api/geocode/json?address=${request.query.data}&key=${process.env.GEOCODE_API_KEY}`;

  if ( locations[url] ) {
    response.send(locations[url]);
  }
  else {
    superagent.get(url)
      .then(data => {
        const geoData = data.body;
        const location = new Location(request.query.data, geoData);
        locations[url] = location;
        response.send(location);
      })
      .catch( () => {
        errorHandler('So sorry, something went wrong.', request, response);
      });
  }
}

function Location(query, geoData) {
  this.search_query = query;
  this.formatted_query = geoData.results[0].formatted_address;
  this.latitude = geoData.results[0].geometry.location.lat;
  this.longitude = geoData.results[0].geometry.location.lng;
}


// http://localhost:3000/weather?data%5Blatitude%5D=47.6062095&data%5Blongitude%5D=-122.3320708
// That encoded query string is: data[latitude]=47.6062095&data[longitude]=122.3320708
function weatherHandler(request,response) {

  const url = `https://api.darksky.net/forecast/${process.env.WEATHER_API_KEY}/${request.query.data.latitude},${request.query.data.longitude}`;

  superagent.get(url)
    .then( data => {
      const weatherSummaries = data.body.daily.data.map(day => {
        return new Weather(day);
      });
      response.status(200).json(weatherSummaries);
    })
    .catch( () => {
      errorHandler('So sorry, something went wrong.', request, response);
    });

}

function Weather(day) {
  this.forecast = day.summary;
  this.time = new Date(day.time * 1000).toString().slice(0, 15);
}

function notFoundHandler(request,response) {
  response.status(404).send('huh?');
}

function errorHandler(error,request,response) {
  response.status(500).send(error);
}


// Make sure the server is listening for requests
app.listen(PORT, () => console.log(`App is listening on ${PORT}`) );
