# Dendra NOAA GOES API

Provides a Feathers service (REST API) wrapper around the NOAA GOES Data Collection System. Used internally to obtain message data from satellite-enabled Data Collection Platforms.


## Instructions

1. Be sure you have Node version 6.11.x. If you’re using nvm, you may need to `nvm use 6.11`.

2. Clone this repo.

3. Make this project directory the current directory, i.e. `cd dendra-noaa-goes-api`.

4. Install modules via `npm install`.

5. If all goes well, you should be able to run the predefined package scripts.


## To build and publish the Docker image

1. Make this project directory the current directory, i.e. `cd dendra-noaa-goes-api`.

2. Build the project `docker build -t dendra:dendra-noaa-goes-api .`.

3. Tag the desired image, e.g. `docker tag f0ec409b5194 dendra/dendra-noaa-goes-api:latest`.

4. Push it via `docker push dendra/dendra-noaa-goes-api`.
