
function initYandex(){
    // Creating the map.
    var myMap = new ymaps.Map("map", {
        // The map center coordinates.
        // Default order: «latitude, longitude».
        // To not manually determine the map center coordinates,
        // use the Coordinate detection tool.
        center: [55.76, 37.64],
        // Zoom level. Acceptable values:
        // from 0 (the entire world) to 19.
        zoom: 7
    });
    var myGeocoder = ymaps.geocode("Почта Росии отделение");

    myGeocoder.then(
        function (res) {
            console.log(res.geoObjects.get(0))
            myMap.geoObjects.add(res.geoObjects.get(0));
            myMap.geoObjects.add(res.geoObjects.get(1));
            myMap.geoObjects.add(res.geoObjects.get(2));
        },
        function (err) {
            alert('Error');
        }
    );
}
ymaps.ready(initYandex);

// var myGeocoder = ymaps.geocode("Почта Росии Москва");
// myGeocoder.then(
//     function (res) {
//         console.log(res.geoObjects.get(0))
//         res.geoObjects.forEach((sample, idx) => {
//             console.log(sample)
//         });
//         myMap.geoObjects.add(res.geoObjects);
//     },
//     function (err) {
//         alert('Error');
//     }
// );