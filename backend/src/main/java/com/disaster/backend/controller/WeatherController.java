package com.disaster.backend.controller;

import com.disaster.backend.entity.DisasterAlert;
import com.disaster.backend.service.DisasterAlertService;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.client.RestTemplate;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/weather")
@CrossOrigin(origins = {
        "http://localhost:5173",
        "https://disaster-management-pink-seven.vercel.app"
})
public class WeatherController {

    @Value("${openweather.api.key}")
    private String apiKey;

    private final DisasterAlertService disasterAlertService;

    public WeatherController(
            DisasterAlertService disasterAlertService) {

        this.disasterAlertService = disasterAlertService;
    }


    // =========================================
    // GET CURRENT WEATHER
    // =========================================

    @GetMapping
    public Map<String, Object> getWeather(
            @RequestParam double latitude,
            @RequestParam double longitude) {

        String url =
                "https://api.openweathermap.org/data/2.5/weather"
                + "?lat=" + latitude
                + "&lon=" + longitude
                + "&appid=" + apiKey
                + "&units=metric";

        RestTemplate restTemplate =
                new RestTemplate();

        @SuppressWarnings("unchecked")
        Map<String, Object> weather =
                restTemplate.getForObject(
                        url,
                        Map.class
                );


        // =====================================
        // CHECK WEATHER FOR DISASTER
        // =====================================

        if (weather != null) {

            checkForDisaster(
                    weather,
                    latitude,
                    longitude
            );
        }


        return weather;
    }


    // =========================================
    // CHECK WEATHER FOR DISASTER
    // =========================================

    private void checkForDisaster(
            Map<String, Object> weather,
            double latitude,
            double longitude) {

        try {

            // =================================
            // GET MAIN DATA
            // =================================

            Object mainObject =
                    weather.get("main");

            if (!(mainObject instanceof Map)) {
                return;
            }

            Map<?, ?> main =
                    (Map<?, ?>) mainObject;


            // =================================
            // GET TEMPERATURE
            // =================================

            Object tempObject =
                    main.get("temp");

            if (!(tempObject instanceof Number)) {
                return;
            }

            double temperature =
                    ((Number) tempObject).doubleValue();


            // =================================
            // GET WEATHER CONDITION
            // =================================

            String condition = "";

            Object weatherObject =
                    weather.get("weather");

            if (weatherObject instanceof List<?> weatherList
                    && !weatherList.isEmpty()) {

                Object firstWeather =
                        weatherList.get(0);

                if (firstWeather instanceof Map<?, ?>) {

                    Object conditionObject =
                            ((Map<?, ?>) firstWeather)
                                    .get("main");

                    if (conditionObject != null) {

                        condition =
                                conditionObject.toString();
                    }
                }
            }


            // =================================
            // GET RAINFALL
            // =================================

            double rainfall = 0.0;

            Object rainObject =
                    weather.get("rain");

            if (rainObject instanceof Map<?, ?> rainMap) {

                Object rain1h =
                        rainMap.get("1h");

                if (rain1h instanceof Number) {

                    rainfall =
                            ((Number) rain1h)
                                    .doubleValue();

                } else {

                    Object rain3h =
                            rainMap.get("3h");

                    if (rain3h instanceof Number) {

                        rainfall =
                                ((Number) rain3h)
                                        .doubleValue();
                    }
                }
            }


            // =================================
            // LOCATION
            // =================================

            String location =
                    latitude + ", " + longitude;


            // =================================
            // DISASTER DETECTION
            // =================================


            // ---------------------------------
            // 1. THUNDERSTORM
            // ---------------------------------

            if (condition.equalsIgnoreCase(
                    "Thunderstorm")) {

                createHeavyRainAlert(
                        latitude,
                        longitude,
                        location
                );
            }


            // ---------------------------------
            // 2. HEAVY RAIN
            // ---------------------------------

            else if (
                    condition.equalsIgnoreCase("Rain")
                    && rainfall >= 7.5
            ) {

                createHeavyRainAlert(
                        latitude,
                        longitude,
                        location
                );
            }


            // ---------------------------------
            // 3. EXTREME HEAT
            // ---------------------------------

            else if (temperature >= 40) {

                createExtremeHeatAlert(
                        latitude,
                        longitude,
                        location,
                        temperature
                );
            }


            // ---------------------------------
            // 4. NORMAL WEATHER
            // ---------------------------------

            else {

                System.out.println(
                        "No disaster detected. "
                        + "Temperature: "
                        + temperature
                        + "°C, Condition: "
                        + condition
                        + ", Rainfall: "
                        + rainfall
                        + " mm"
                );
            }


        } catch (Exception e) {

            System.out.println(
                    "Weather disaster detection error: "
                    + e.getMessage()
            );
        }
    }


    // =========================================
    // CREATE HEAVY RAIN ALERT
    // =========================================

    private void createHeavyRainAlert(
            double latitude,
            double longitude,
            String location) {


        // Check whether an active alert
        // already exists

        boolean alertExists =
                disasterAlertService
                        .activeAlertExists(
                                "Heavy Rain"
                        );


        if (alertExists) {

            System.out.println(
                    "Heavy Rain alert already exists."
            );

            return;
        }


        // Create new alert

        DisasterAlert alert =
                new DisasterAlert();


        alert.setDisasterType(
                "Heavy Rain"
        );


        alert.setTitle(
                "Heavy Rain Detected"
        );


        alert.setMessage(
                "Heavy rainfall or thunderstorm "
                + "conditions have been detected. "
                + "Please stay indoors and move to "
                + "a safe location if necessary."
        );


        alert.setSeverity(
                "HIGH"
        );


        alert.setLocation(
                location
        );


        alert.setLatitude(
                latitude
        );


        alert.setLongitude(
                longitude
        );


        alert.setRadius(
                10.0
        );


        alert.setActive(
                true
        );


        disasterAlertService.createAlert(
                alert
        );


        System.out.println(
                "Heavy Rain disaster alert created."
        );
    }


    // =========================================
    // CREATE EXTREME HEAT ALERT
    // =========================================

    private void createExtremeHeatAlert(
            double latitude,
            double longitude,
            String location,
            double temperature) {


        // Check whether active alert
        // already exists

        boolean alertExists =
                disasterAlertService
                        .activeAlertExists(
                                "Extreme Heat"
                        );


        if (alertExists) {

            System.out.println(
                    "Extreme Heat alert already exists."
            );

            return;
        }


        // Create new alert

        DisasterAlert alert =
                new DisasterAlert();


        alert.setDisasterType(
                "Extreme Heat"
        );


        alert.setTitle(
                "Extreme Heat Warning"
        );


        alert.setMessage(
                "Very high temperature of "
                + String.format(
                        "%.1f",
                        temperature
                )
                + "°C has been detected. "
                + "Avoid unnecessary outdoor activities "
                + "and stay hydrated."
        );


        alert.setSeverity(
                "HIGH"
        );


        alert.setLocation(
                location
        );


        alert.setLatitude(
                latitude
        );


        alert.setLongitude(
                longitude
        );


        alert.setRadius(
                10.0
        );


        alert.setActive(
                true
        );


        disasterAlertService.createAlert(
                alert
        );


        System.out.println(
                "Extreme Heat disaster alert created."
        );
    }
}