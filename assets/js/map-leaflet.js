$(document).ready(function($) {
    "use strict";

    var mapId = "ts-map-hero";

    //==================================================================================================================
    // VARIABLES
    // =================================================================================================================

    var newMarkers = [];
    var loadedMarkersData = [];
    var allMarkersData;
    var lastMarker;
    var map;
    var markerCluster;
    var userLocationTurf;
    var searchResult;
    var userLocationUser;
    var userIcon = `<svg version="1.1" id="Capa_1" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" x="0px" y="0px"
    viewBox="0 0 512 512" style="enable-background:new 0 0 512 512;" xml:space="preserve">
<path style="fill:#FF1A4B;" d="M433.531,177.531c0,40.043-28.086,106.04-83.477,196.141
   c-40.503,65.887-81.586,121.479-81.996,122.039L256,512l-12.057-16.289c-0.41-0.56-41.493-56.152-81.996-122.039
   c-55.391-90.101-83.477-156.098-83.477-196.141C78.469,79.645,158.105,0,256,0S433.531,79.645,433.531,177.531z"/>
<path style="fill:#FFDBA9;" d="M357.517,174.779c0,55.982-45.536,101.527-101.518,101.527s-101.517-45.546-101.517-101.527
   c0-55.972,45.536-101.518,101.517-101.518S357.517,118.807,357.517,174.779z"/>
<path style="fill:#D5243E;" d="M433.531,177.531c0,40.043-28.086,106.04-83.477,196.141
   c-40.503,65.887-81.586,121.479-81.996,122.039L256,512V0C353.895,0,433.531,79.645,433.531,177.531z"/>
<path style="fill:#FFC473;" d="M357.517,174.779c0,55.982-45.536,101.527-101.518,101.527V73.261
   C311.982,73.261,357.517,118.807,357.517,174.779z"/>
<g>
</g>
<g>
</g>
<g>
</g>
<g>
</g>
<g>
</g>
<g>
</g>
<g>
</g>
<g>
</g>
<g>
</g>
<g>
</g>
<g>
</g>
<g>
</g>
<g>
</g>
<g>
</g>
<g>
</g>
</svg>`

    if ($("#" + mapId).length) {

        //==============================================================================================================
        // MAP SETTINGS
        // =============================================================================================================
        var mapElement = $(document.getElementById(mapId));
        var mapDefaultZoom = parseInt(mapElement.attr("data-ts-map-zoom"), 10);
        var centerLatitude = mapElement.attr("data-ts-map-center-latitude");
        var centerLongitude = mapElement.attr("data-ts-map-center-longitude");
        var locale = mapElement.attr("data-ts-locale");
        var currency = mapElement.attr("data-ts-currency");
        var unit = mapElement.attr("data-ts-unit");
        var controls = parseInt(mapElement.attr("data-ts-map-controls"), 10);
        var scrollWheel = parseInt(mapElement.attr("data-ts-map-scroll-wheel"), 10);
        var leafletMapProvider = mapElement.attr("data-ts-map-leaflet-provider");
        var leafletAttribution = mapElement.attr("data-ts-map-leaflet-attribution");
        var zoomPosition = mapElement.attr("data-ts-map-zoom-position");
        var mapBoxAccessToken = mapElement.attr("data-ts-map-mapbox-access-token");
        var mapBoxId = mapElement.attr("data-ts-map-mapbox-id");
        var userAddress = [];

        if (mapElement.attr("data-ts-display-additional-info")) {
            var displayAdditionalInfoTemp = mapElement.attr("data-ts-display-additional-info").split(";");
            console.log(displayAdditionalInfoTemp)
            var displayAdditionalInfo = [];
            for (var i = 0; i < displayAdditionalInfoTemp.length; i++) {
                displayAdditionalInfo.push(displayAdditionalInfoTemp[i].split("_"));
            }
        }

        // Default map zoom
        if (!mapDefaultZoom) {
            mapDefaultZoom = 14;
        }

        //==================================================================================================================
        // MAP ELEMENT
        // =================================================================================================================
        map = L.map(mapId, {
            zoomControl: false,
            scrollWheelZoom: scrollWheel
        });
        map.setView([centerLatitude, centerLongitude], mapDefaultZoom);

        L.tileLayer(leafletMapProvider, {
            attribution: leafletAttribution,
            id: mapBoxId,
            accessToken: mapBoxAccessToken
        }).addTo(map);


        if( controls !== 0 && zoomPosition ){
            L.control.zoom({position: zoomPosition}).addTo(map);
        }
        else if ( controls !== 0 ){
            L.control.zoom({position: "topright"}).addTo(map);
        }

        //==================================================================================================================
        // LOAD DATA
        // =================================================================================================================
        loadData();
        userLocation();
        $("#disclaimer").modal({
            show: true,
        })
    }

    function populateDetailsPage() {
        if (localStorage.getItem('seletectedItem')) {
            console.log(localStorage.getItem('seletectedItem'))
            var info = JSON.parse(localStorage.getItem('seletectedItem'));
            userLocation();
        }
        const pathname = window.location.pathname;
        if (info && pathname == '/detail-01.html') {
            $("#ts-map-detail").attr("data-ts-map-center-latitude", info.latitude);
            $("#ts-map-detail").attr("data-ts-map-center-longitude", info.longitude);
            $("#pha_name").html(info.name);
            $("#pha_addr").html(info.address);
            const medicineHtml = info.medicines.map((medicine, idx) => {
                const isAdded = localStorage.getItem('cart') != null ? JSON.parse(localStorage.getItem('cart')).filter(added => added.pharmacy === info.name && added.medicine_id === medicine.id).length > 0 : false
                return `<div class="ts-box col-sm-4 medicine">

                <dl class="ts-description-list__line mb-0">

                    <dt>ID:</dt>
                    <dd>${medicine.id}</dd>

                    <dt>Name:</dt>
                    <dd>${medicine.name}</dd>

                    <dt>Ingredients:</dt>
                    <dd>${medicine.ingredients.map(ingredient => `${ingredient.name}(${ingredient.strength}${ingredient.unit})`).join(';')}</dd>

                    <dt>Number Packs:</dt>
                    <dd>${medicine.num_packs}</dd>

                    <dt>Pack Size:</dt>
                    <dd>${medicine.pack_size}</dd>

                    <dt>Price:</dt>
                    <dd>${medicine.sep}</dd>

                    <dt>Dosage Form:</dt>
                    <dd>${medicine.dosage_form}</dd>

                    <dt>Reg No:</dt>
                    <dd>${medicine.regno}</dd>

                </dl>
                ${!isAdded ? `<button class="btn btn-primary w-100 add_cart" id="add_cart__${idx}">Add to Cart</button>`
                :`<button class="btn btn-danger w-100 delete_cart" id="delete_cart__${idx}">Remove Cart</button>`}
            </div>`
            }).reduce((mainHtml, currHtml) => mainHtml + currHtml, '');
            $("#medicineList").html(medicineHtml);
            $("#cartItems").html(localStorage.getItem("cart") != null ? `Cart(${JSON.parse(localStorage.getItem("cart")).length})` : 'No Items');
        }
    }

    populateDetailsPage();

    $(".add_cart").on("click", function (e) {
        console.log('Testing', localStorage.getItem('seletectedItem'));
        if (localStorage.getItem('seletectedItem') != '') {
            const info = JSON.parse(localStorage.getItem('seletectedItem'));
            const idx = e.target.id.split('__')[1];
            addToCart(info.name, info.medicines[idx].id);
        }
        window.location.reload();
    })

    $(".delete_cart").on("click", function (e) {
        if (localStorage.getItem('seletectedItem') != '') {
            const info = JSON.parse(localStorage.getItem('seletectedItem'));
            const idx = e.target.id.split('__')[1];
            removeFromCart(info.name, info.medicines[idx].id);
        }
        window.location.reload();
    })
    
    $("#cartItems").on("click", function(e) {
        
    })

    function addToCart(pharmacy, medicineId) {
        let cart = localStorage.getItem('cart')
        if(cart == null) {
            cart = []
        } else {
            cart = JSON.parse(cart);
        }
        cart.push({pharmacy: pharmacy, medicine_id: medicineId})
        console.log(cart);
        localStorage.setItem('cart', JSON.stringify(cart));
    }

    function removeFromCart(pharmacy, medicineId) {
        let cart = localStorage.getItem('cart')
        if(cart == null) {
            return;
        } else {
            cart = JSON.parse(cart);
        }
        cart = cart.filter(item => !(item.pharmacy === pharmacy && item.medicine_id === medicineId))
        localStorage.setItem('cart', JSON.stringify(cart));
    }

    function userLocation() {
        if (!navigator.geolocation) {
            console.log('Geolocation is not supported by your browser')
        } else {
            navigator.geolocation.getCurrentPosition(success => {
               userLocationTurf = turf.point([success.coords.longitude, success.coords.latitude]);
               userLocationUser = success.coords;
               console.log('User Location: ', userLocationUser)
               getAddress(userLocationUser)
               loadData();
            }, err => console.log(err))
        }
    }
    
    function getAddress(location) {
        axios.get(`https://api.mapbox.com/geocoding/v5/mapbox.places/${location.longitude},${location.latitude}.json?tpe=poi&access_token=pk.eyJ1Ijoia2FiZWxvIiwiYSI6ImNrY3V5eGtkNjA5OTMzMG8xbXFpdDIzNHoifQ.Y1duf95N56uwYeFXeBaqUg`)
        .then(loc => {
            if(loc.data) {
                userAddress = loc.data.features[0].place_name.split(',');
                const postalCode = loc.data.features[2].place_name.split(',');
                console.log(loc.data.features)
                $("#address").val(userAddress[0]);
                $("#city").val(userAddress[1]);
                $("#province").val(postalCode[2]);
                $("#postal").val(postalCode[0]);
            }
        }).catch(err => console.log(err));
    }
    var base64DecodedFile = '';
    $(":file").on('change', function(e) {
        const fileReader = new FileReader()
        fileReader.readAsBinaryString(this.files['0']);
        fileReader.onload = function() {
            console.log("Reader: ", fileReader.result);
            base64DecodedFile = btoa(fileReader.result)
        }
        fileReader.onerror = function() {
            console.log("Error Reading the file");
        }
    })

    $("#order").on("click", function(e) {
        $("#order").text('Sending Info...');
        const fnames = $("#title").val();
        const email = $("#email").val();
        const presciption = base64DecodedFile;
        const address = $("#address").val();
        const city = $("#city").val();
        const province = $("#province").val();
        const postal = $("#postal").val();
        const medicines = localStorage.getItem('cart') != null ? JSON.parse(localStorage.getItem('cart')) : [];
        const med_reserve = Parse.Object.extend('med_reserve');
        const query = new med_reserve();

        query.set('full_name', fnames);
        query.set('address', `${address}, ${city}, ${province} ${postal}`);
        query.set('medicines', medicines);
        query.set('prescription', new Parse.File(fnames.toLowerCase().split(' ').join('_') + ".pdf", { base64: presciption }));

        query.save().then(
        (result) => {
            console.log(result)
            localStorage.removeItem('cart');
            emailjs.send("service_uicxnjs","template_ow1717c",{
                from_name: "Meds Locator",
                to_name: fnames,
                address: `${address}, ${city}, ${province} ${postal}`,
                reply_to: "info@medslocator.co.za",
                pharmacy_email: "stephans.kgatle@gmail.com",
                email: email,
            });
                
                $("#ts-main").html(`
                <section id="submitted" class="ts-block">
                <div class="container">
                    <div class="row">
        
                        <div class="offset-2 col-md-8 text-center">
        
                            <i class="far fa-check-circle ts-text-color-primary display-4 mb-2"></i>
                            <h1 class="ts-text-color-primary">Thank You!</h1>
                            <h4 class="ts-text-color-light">Your Order was submitted Successfully</h4>
                            <a href="index.html" class="btn btn-secondary">Back to Home</a>
                            <hr>
        
                        </div>
        
                    </div>
                </div>
            </section>
                `)
        },
        (error) => {
            if (typeof document !== 'undefined') document.write(`Error while creating med_reserve: ${JSON.stringify(error)}`);
            console.error('Error while creating med_reserve: ', error);
        }
        );
    })

    function loadData(parameters) {
        $.ajax({
            url: "assets/db/items.json",
            dataType: "json",
            method: "GET",
            cache: false,
            success: function (results) {

                if (typeof parameters !== "undefined" && parameters["formData"]) {
                    //loadFormData(parameters);
                }
                else {
                    console.log(results)
                    allMarkersData = results.map(store => {
                        store.nomeds = store.medicines.length;
                        const storeLoc = turf.point([store.longitude, store.latitude]);
                        console.log(store, storeLoc, userLocationTurf)
                        store.distance = userLocationTurf != null ? turf.distance(userLocationTurf, storeLoc).toFixed(2) + 'KM' : 'N/A';
                        return store;
                    });
                    console.log(allMarkersData);
                    loadedMarkersData = allMarkersData;
                }
                
                const clear = (parameters == null || parameters['clearCluster'] == null) ? true : false;
                console.log('From here');
                createMarkers(clear); // call function to create markers
            },
            error: function (e) {
                console.log(e);
            }
        });
    }
    

    $("#search-btn").on('click', function (e) {
        const searchText = $("#medicine").val();
        const status = $("#status").val();
        const distance = $("#distance").val();
        
        if (searchText != null && searchText != '') {
            loadedMarkersData = allMarkersData.map(shop => {
                const shopTemp = {...shop, medicines: [...shop.medicines]}
                shopTemp.medicines = shopTemp.medicines.filter(medicine => medicine.name.toLowerCase().match(searchText.toLowerCase()) != null)
                shopTemp.nomeds = shopTemp.medicines.length;
                return shopTemp;
            }).filter(shop => shop.medicines.length > 0);
            searchResult = loadedMarkersData;
        } else {
            loadedMarkersData = allMarkersData
        }
        createMarkers();
        console.log(loadedMarkersData)
    })

    $("#ts-results").on('click', '.ts-result', function(e) {
        const idx  = e.currentTarget.id.split('_')[1];
        sessionStorage.setItem("location", `{'lat': ${userLocationUser.latitude}, 'lng': ${userLocationUser.longitude}}`);
        localStorage.setItem('seletectedItem', loadedMarkersData[idx] != null ? JSON.stringify(loadedMarkersData[idx]) : '');
        window.location.href = 'detail-01.html';
    })

    //==================================================================================================================
    // Create DIV with the markers data
    // =================================================================================================================
    function createMarkers(clearCluster = true) {
        console.log('Clear: ', clearCluster);
        if (clearCluster) {
            markerCluster = L.markerClusterGroup({
                showCoverageOnHover: false
            });
            if (userLocationUser) {
                const iconUser = L.divIcon({
                    html: userIcon,
                    iconSize: [42, 47],
                    iconAnchor: [0, 47]
                });
                console.log(map);
                map.setView([userLocationUser.latitude, userLocationUser.longitude], mapDefaultZoom);
                var marker = L.marker([userLocationUser.latitude, userLocationUser.longitude], {icon: iconUser});
                markerCluster.addLayer(marker);
                newMarkers.push(marker);
            }
        }

        for (var i = 0; i < loadedMarkersData.length; i++) {

            var markerContent = document.createElement('div');

            markerContent.innerHTML =
                '<div class="ts-marker-wrapper">' +
                    '<a href="#" class="ts-marker" data-ts-id="' + loadedMarkersData[i]["id"] + '" data-ts-ln="' + i + '" onclick="return false;">' +
                    ( ( loadedMarkersData[i]["ribbon"] !== undefined ) ? '<div class="ts-marker__feature">' + loadedMarkersData[i]["ribbon"] + '</div>' : "" ) +
                    ( ( loadedMarkersData[i]["name"] !== undefined ) ? '<div class="ts-marker__title">' + loadedMarkersData[i]["name"] + '</div>' : "" ) +
                    ( ( loadedMarkersData[i]["price"] !== undefined && loadedMarkersData[i]["price"] > 0 ) ? '<div class="ts-marker__info">' + formatPrice(loadedMarkersData[i]["price"]) + '</div>' : "" ) +
                    ( '<div class="ts-marker__image" style="background-image: url(assets/img/marker-pha.png)"></div>') +
                    '</a>' +
                '</div>';

            placeLeafletMarker({"i": i, "markerContent": markerContent, "method": "latitudeLongitude"});

        }

        // After the markers are created, do the rest

        markersDone();
    }

    //==================================================================================================================
    // When markers are placed, do the rest
    // =================================================================================================================
    function markersDone() {

        //==================================================================================================================
        // MARKER CLUSTERER
        // =============================================================================================================
        map.addLayer(markerCluster);
        map.on("moveend", createSideBarResult);
        createSideBarResult();
    }

    //==================================================================================================================
    // Google Rich Marker plugin
    // =================================================================================================================

    function placeLeafletMarker(parameters) {

        var i = parameters["i"];

        // Define marker HTML

        var markerIcon = L.divIcon({
            html: parameters["markerContent"].innerHTML,
            iconSize: [42, 47],
            iconAnchor: [0, 47]
        });

        // Attach marker to map
        var marker = L.marker([loadedMarkersData[i]["latitude"], loadedMarkersData[i]["longitude"]], {
            icon: markerIcon
        });

        marker.loopNumber = i;

        markerCluster.addLayer(marker);

        // Open Popup on click

        marker.on('click', function () {
            if (lastMarker && lastMarker._icon) {
                $(lastMarker._icon.firstChild).removeClass("ts-hide-marker");
            }
            openInfobox({
                "id": $(this._icon).find(".ts-marker").attr("data-ts-id"),
                "parentMarker": marker,
                "i": i,
                "url": "assets/db/items.json"
            });
        });

        newMarkers.push(marker);
    }


    //==================================================================================================================
    // Open InfoBox on marker click
    // =================================================================================================================
    function openInfobox(parameters) {

        var i = parameters["i"];
        var parentMarker = parameters["parentMarker"];
        var id = parameters["id"];
        var infoboxHtml = document.createElement('div');

        // First create and HTML for infobox
        createInfoBoxHTML({"i": i, "infoboxHtml": infoboxHtml});

        //==============================================================================================================
        // Set InfoBox options
        //==============================================================================================================

        var popup = L.popup({closeButton: false, offset: [120, 0], closeOnClick: false})
            .setLatLng([parentMarker._latlng.lat, parentMarker._latlng.lng])
            .setContent(infoboxHtml)
            .openOn(map);

        // Set the new "Last" opened marker
        lastMarker = parentMarker;

        // Hide the current marker, so only InfoBox is visible
        parentMarker._markerIcon = parentMarker._icon.firstChild;
        $(parentMarker._icon.firstChild).addClass("ts-hide-marker");

        setTimeout(function () {
            $(".ts-infobox[data-ts-id='" + id + "']").closest(".infobox-wrapper").addClass("ts-show");

            $(".ts-infobox[data-ts-id='" + id + "'] .ts-close").on("click", function () {
                $(".ts-infobox[data-ts-id='" + id + "']").closest(".infobox-wrapper").removeClass("ts-show");
                $(parentMarker._markerIcon).removeClass("ts-hide-marker");
                map.closePopup();
            });
        }, 50);

    }

    //==================================================================================================================
    // Create Infobox HTML element
    //==================================================================================================================

    function createInfoBoxHTML(parameters) {

        var i = parameters["i"];
        var infoboxHtml = parameters["infoboxHtml"];

        infoboxHtml.innerHTML =
            '<div class="infobox-wrapper">' +
                '<div class="ts-infobox" data-ts-id="' + loadedMarkersData[i]["id"] + '">' +
                    '<img src="assets/img/infobox-close.svg" class="ts-close">' +

                    ( ( loadedMarkersData[i]["ribbon"] !== undefined ) ? '<div class="ts-ribbon">' + loadedMarkersData[i]["ribbon"] + '</div>' : "" ) +
                    ( ( loadedMarkersData[i]["ribbon_corner"] !== undefined ) ? '<div class="ts-ribbon-corner"><span>' + loadedMarkersData[i]["ribbon_corner"] + '</span></div>' : "" ) +

                    '<a href="#" class="ts-infobox__wrapper ts-black-gradient">' +
                        ( ( loadedMarkersData[i]["badge"] !== undefined && loadedMarkersData[i]["badge"].length > 0 ) ? '<div class="badge badge-dark">' + loadedMarkersData[i]["badge"] + '</div>' : "" ) +
                        '<div class="ts-infobox__content">' +
                            '<figure class="ts-item__info">' +
                                ( ( loadedMarkersData[i]["province"] !== undefined && loadedMarkersData[i]["province"] > 0 ) ? '<div class="ts-item__info-badge">' + loadedMarkersData[i]["province"] + '</div>' : "" ) +
                                ( ( loadedMarkersData[i]["name"] !== undefined && loadedMarkersData[i]["name"].length > 0 ) ? '<h4>' + loadedMarkersData[i]["name"] + '</h4>' : "" ) +
                                ( ( loadedMarkersData[i]["address"] !== undefined && loadedMarkersData[i]["address"].length > 0 ) ? '<aside><i class="fa fa-map-marker mr-2"></i>' + loadedMarkersData[i]["address"] + '</aside>' : "" ) +
                            '</figure>' +
                            additionalInfoHTML({display: displayAdditionalInfo, i: i}) +
                            '</div>' +
                        '<div class="ts-infobox_image" style="background-image: url(' + loadedMarkersData[i]["marker_image"] + ')"></div>' +
                    '</a>' +
                '</div>' +
            '</div>';
    }

    //==================================================================================================================
    // Create Additional Info HTML element
    //==================================================================================================================

    function additionalInfoHTML(parameters) {
        var i = parameters["i"];
        var displayParameter;

        var additionalInfoHtml = "";
        for (var a = 0; a < parameters["display"].length; a++) {
            displayParameter = parameters["display"][a];
            if (loadedMarkersData[i][displayParameter[0]] !== undefined) {
                additionalInfoHtml +=
                    '<dl>' +
                        '<dt>' + displayParameter[1] + '</dt>' +
                        '<dd>' + loadedMarkersData[i][displayParameter[0]] + '</dd>' +
                    '</dl>';
            }
        }
        if (additionalInfoHtml) {
            return '<div class="ts-description-lists">' + additionalInfoHtml + '</div>';
        }
        else {
            return "";
        }
    }

    function test() {
        console.log('CLicked')
    }

    //==================================================================================================================
    // Create SideBar HTML Results
    //==================================================================================================================
    function createSideBarResult() {

        //var visibleMarkersId = [];
        var visibleMarkersOnMap = [];
        var resultsHtml = [];

        for (var i = 0; i < loadedMarkersData.length; i++) {
            //visibleMarkersOnMap.push( newMarkers[i] );

            if (map.getBounds().contains(newMarkers[i].getLatLng())) {
                visibleMarkersOnMap.push(newMarkers[i]);
                //newMarkers[i].addTo(map);
            }
            else {
                //newMarkers[i].setVisible(false);
                //newMarkers[i].remove();
            }

        }

        //markerCluster.refreshClusters();

        for (i = 0; i < visibleMarkersOnMap.length; i++) {
            var id = visibleMarkersOnMap[i].loopNumber;
            var additionalInfoHtml = "";

            if (loadedMarkersData && loadedMarkersData[id] && loadedMarkersData[id]["additional_info"]) {
                for (var a = 0; a < loadedMarkersData[id]["additional_info"].length; a++) {
                    additionalInfoHtml +=
                        '<dl>' +
                            '<dt>' + loadedMarkersData[id]["additional_info"][a]["title"] + '</dt>' +
                            '<dd>' + loadedMarkersData[id]["additional_info"][a]["value"] + '</dd>' +
                        '</dl>';
                }
            }
            if (loadedMarkersData && loadedMarkersData[id]) {
                resultsHtml.push(
                    '<div class="ts-result-link" data-ts-id="' + loadedMarkersData[id]["id"] + '" data-ts-ln="' + newMarkers[id].loopNumber + '"' + 'id="result_' + i +'">' +
                        '<span class="ts-center-marker"><img src="assets/img/result-center.svg"></span>' +
                        '<a href="#" class="card ts-item ts-card ts-result" ' + 'id="result_' + i +'">' +
                            ( ( loadedMarkersData[i]["ribbon"] !== undefined ) ? '<div class="ts-ribbon">' + loadedMarkersData[i]["ribbon"] + '</div>' : "" ) +
                            ( ( loadedMarkersData[i]["ribbon_corner"] !== undefined ) ? '<div class="ts-ribbon-corner"><span>' + loadedMarkersData[i]["ribbon_corner"] + '</span></div>' : "" ) +
                            '<div href="#" class="card-img ts-item__image" style="background-image: url(' + loadedMarkersData[id]["marker_image"] + ')"></div>' +
                            '<div class="card-body">' +
                                '<div class="ts-item__info-badge">' + loadedMarkersData[id]["province"] + '</div>' +
                                '<figure class="ts-item__info">' +
                                    '<h4>' + loadedMarkersData[id]["name"] + '</h4>' +
                                    '<aside>' +
                                    '<i class="fa fa-map-marker mr-2"></i>' + loadedMarkersData[id]["address"] + '</aside>' +
                                '</figure>' +
                                additionalInfoHTML({display: displayAdditionalInfo, i: i}) +
                            '</div>' +
                            '<div class="card-footer">' +
                                '<span class="ts-btn-arrow">Detail</span>' +
                            '</div>' +
                        '</a>' +
                    '</div>'
                );
            }
        }


        $(".ts-results-wrapper").html(resultsHtml);

        var $results = $("#ts-results").find(".ts-sly-frame");
        if ($results.hasClass("ts-loaded")) {
            $results.sly("reload");
        }
        else {
            initializeSly();
        }

        var resultsBar = $(".scroll-wrapper.ts-results__vertical-list, .scroll-wrapper.ts-results__grid");
        if ($(window).width() < 575) {
            resultsBar.find(".ts-results__vertical").css("pointer-events", "none");
            resultsBar.on("click", function () {
                $(this).addClass("ts-expanded");
                $(this).find(".ts-results__vertical").css("pointer-events", "auto");
                $("#ts-map-hero").addClass("ts-dim-map");
            });

            $("#ts-map-hero").on("click", function(){
                if (resultsBar.hasClass("ts-expanded")) {
                    resultsBar.removeClass("ts-expanded");
                    $("#ts-map-hero").removeClass("ts-dim-map");
                    resultsBar.find(".ts-results__vertical").css("pointer-events", "none");
                }
            });
        }
        else {
            resultsBar.removeClass("ts-expanded");
            resultsBar.find(".ts-results__vertical").css("pointer-events", "auto");
            $("#ts-map-hero").removeClass("ts-dim-map");
        }

    }

    // Center map on result click (Disabled)
    //==============================================================================================================

    $(document).on("click", ".ts-center-marker", function () {
        $(".ts-marker").parent().removeClass("ts-active-marker");
        map.setView( newMarkers[ $(this).parent().attr("data-ts-ln") ].getLatLng() );
        var id = $(this).parent().attr("data-ts-id");
        $(".ts-marker[data-ts-id='" + id + "']").parent().addClass("ts-active-marker");
    });

    // Highlight marker on result hover
    //==============================================================================================================

    var timer;
    $(document).on({
        mouseenter: function () {
            console.log('Working');
            var id = $(this).parent().attr("data-ts-id");
            timer = setTimeout(function(){
                $(".ts-marker").parent().addClass("ts-marker-hide");
                $(".ts-marker[data-ts-id='" + id + "']").parent().addClass("ts-active-marker");
            }, 500);
        },
        mouseleave: function () {
            clearTimeout(timer);
            $(".ts-marker").parent().removeClass("ts-active-marker").removeClass("ts-marker-hide");
        }
    }, ".ts-result");

    function formatPrice(price) {
        console.log(price, Number(price).toLocaleString(locale, {style: 'currency', currency: currency}).replace(/\D\d\d$/, ''));
        return Number(price).toLocaleString(locale, {style: 'currency', currency: currency}).replace(/\D\d\d$/, '');
    }


    var simpleMapId = "ts-map-simple";
    if( $("#"+simpleMapId).length ){

        mapElement = $(document.getElementById(simpleMapId));
        mapDefaultZoom = parseInt(mapElement.attr("data-ts-map-zoom"), 10);
        centerLatitude = mapElement.attr("data-ts-map-center-latitude");
        centerLongitude = mapElement.attr("data-ts-map-center-longitude");
        controls = parseInt(mapElement.attr("data-ts-map-controls"), 10);
        scrollWheel = parseInt(mapElement.attr("data-ts-map-scroll-wheel"), 10);
        leafletMapProvider = mapElement.attr("data-ts-map-leaflet-provider");
        var markerDrag = parseInt( mapElement.attr("data-ts-map-marker-drag"), 10 );


        if (!mapDefaultZoom) {
            mapDefaultZoom = 14;
        }

        map = L.map(simpleMapId, {
            zoomControl: false,
            scrollWheelZoom: scrollWheel
        });
        map.setView([centerLatitude, centerLongitude], mapDefaultZoom);

        L.tileLayer(leafletMapProvider, {
            attribution: leafletAttribution,
            id: mapBoxId,
            accessToken: mapBoxAccessToken
        }).addTo(map);

        ( controls === 1 ) ? L.control.zoom({position: "topright"}).addTo(map) : "";

        var icon = L.icon({
            iconUrl: "assets/img/marker-small.png",
            iconSize: [22, 29],
            iconAnchor: [11, 29]
        });

        var marker = L.marker([centerLatitude, centerLongitude],{
            icon: icon,
            draggable: markerDrag
        }).addTo(map);

    }



});