
var MovingCalculator = function() {
    
    // Inputs corresponding to HTML IDs
    this.inputs = {
        'service_type': 'load_only',
        'vehicle_size': '10',
        'percent_full': '1',
        'elevator': false,
        'floors': '0',
        'truck_distance': '1',
        'disassembly': '0',
        'movers': '2',
        'first_location': "",
        'second_location': "",
        "third_location": "",
        "distance_to_first": 0,
        "distance_to_second": 0,
        "distance_to_third": 0,
        "isWinter": false,
    };
    
    // Store business address for travel fee calculation
    this.__businessAddress = "44.7832515,-93.2861129";
    
    // Time calculation
    this.__time = 0;
    
    // Total distance 
    this.__totalDistance = 0;

    // Generic set function
    this.setElementValue = function(name, value){
        this.inputs[name] = value;
    }
    
    // Calculating the time 
    this.calculateTime = function() {
        var time = 0;

        if (this.inputs.vehicle_size == '10') {
            time = 60;
        } else if (this.inputs.vehicle_size == '14') {
            time = 105;
        } else if (this.inputs.vehicle_size == '17') {
            time = 150;
        } else if (this.inputs.vehicle_size == '24') {
            time = 270;
        } else if (this.inputs.vehicle_size == '26') {
            time = 300;
        }

        if (this.inputs.elevator === true && this.inputs.floors > 0)
        {
            time *= 1.3;
        }
        else
        {
            time *= 1 + .2 * Math.abs(this.inputs.floors);
        }


        time *= 1 + .2 * parseInt(this.inputs.truck_distance);

        time += 7 * parseInt(this.inputs.disassembly);

        time *= this.inputs.percent_full;

        time -= (.3 * time) * (parseInt(this.inputs.movers) - 2);

        if (new Date().getMonth() % 11 < 3) // Is a winter month (Dec, Jan, Feb)
        {
            time *= 1.15;
        }

        if (this.inputs.service_type == 'unload_only') {
            time = time * 0.6666666666;
        } else if (this.inputs.service_type == 'load_unload') {
            time = time + (time * 0.666666666);
        }

        if(this.inputs.isWinter == true){
          time *= 1.15;
        } else {
          time *= 1;
        }

        // this calculates time it takes to drive to all locations
        time *= this.__totalDistance / 80;

        this.__time = time;
        var totalHours = this.minutesToHours(this.__time);
        if (totalHours < 2) totalHours = 2;
        
        var priceMatrix = [[[130, 65], [180, 90], [230, 115]], [[150, 75], [210, 105], [270, 135]]];
        var travelFeeRate = [1.5, 2, 2.5];
        
        var basePrice = priceMatrix[+(new Date().getMonth() % 11 > 3)][parseInt(this.inputs.movers) - 2][0];
        var plusAddlHours = priceMatrix[+(new Date().getMonth() % 11 > 3)][parseInt(this.inputs.movers) - 2][1] * (totalHours - 2);
        var travelPrice = travelFeeRate[this.inputs.movers - 2] * this.__totalDistance;
        var totalPrice = basePrice + plusAddlHours + travelPrice;
        
        document.getElementById("result").innerHTML = "<strong>Total time: </strong>~" + this.minutesToHours(this.__time) + " hour(s)<br><strong>Estimated price: </strong>$" + totalPrice;
    };
    
    // Calculate total distance
    this.calculateDistance = function() {
        this.distanceCallback = function(response, status) {
            if (status == google.maps.DistanceMatrixStatus.OK) 
            {
                this.__totalDistance = 0;
                var origins = response.originAddresses;
                var destinations = response.destinationAddresses;
                var movement = "";
                
                // Response.rows will be an Array[4]
                // 1. Business address to first_loc: response.rows[0].elements[0].distance
                // 2. first_loc to second_location: response.rows[1].elements[1].distance
                // 3. second_loc to third_location: response.rows[2].elements[2].distance
                this.inputs.distance_to_first = response.rows[0].elements[0].distance;
                this.inputs.distance_to_second = response.rows[1].elements[1].distance;
                this.inputs.distance_to_third = response.rows[2].elements[2].distance;
                if (this.inputs.distance_to_first)
                {
                    document.getElementById("distance_to_first").innerHTML = this.inputs.distance_to_first.text;
                    movement += "<strong>1.</strong> " + origins[0] + " to " + origins[1] + ": " + this.inputs.distance_to_first.text;
                    this.__totalDistance += parseInt(this.inputs.distance_to_first.text.replace(",", ""));
                }
                if (this.inputs.distance_to_second)
                {
                    document.getElementById("distance_to_second").innerHTML = this.inputs.distance_to_second.text;
                    movement += "<br><strong>2.</strong> " + origins[1] + " to " + origins[2] + ": " + this.inputs.distance_to_second.text;
                    this.__totalDistance += parseInt(this.inputs.distance_to_second.text.replace(",", ""));
                }
                if (this.inputs.distance_to_third)
                {
                    document.getElementById("distance_to_third").innerHTML = this.inputs.distance_to_third.text;
                    movement += "<br><strong>3.</strong> " + origins[2] + " to " + origins[3] + ": " + this.inputs.distance_to_third.text;
                    this.__totalDistance += parseInt(this.inputs.distance_to_third.text.replace(",", ""));
                }
                
                if (movement)
                {
                    movement += "<br><strong>Total miles:</strong> " + this.__totalDistance;
                }
                document.getElementById("location_tracker").innerHTML = movement;
            }
            this.calculateTime();
        };
        
        if (this.inputs.first_location || this.inputs.second_location || this.inputs.third_location)
        {
            var service = new google.maps.DistanceMatrixService();
            service.getDistanceMatrix(
            {
                origins: [this.__businessAddress, this.inputs.first_location,
                          this.inputs.second_location, this.inputs.third_location],
                destinations: [this.inputs.first_location, this.inputs.second_location,
                              this.inputs.third_location],
                travelMode: google.maps.TravelMode.DRIVING,
                unitSystem: google.maps.UnitSystem.IMPERIAL,
            }, this.distanceCallback.bind(this));

        }
        else
        {
            this.calculateTime();
        }

        
    }
    
    this.minutesToHours = function(minutes)
    {
        var tempTime = minutes / 60;
        return Math.round(tempTime * 100) / 100;
    }
};

var movingCalc = new MovingCalculator();

document.getElementById("service_type").onblur=function()         
{
  movingCalc.setElementValue("service_type",this.options[this.selectedIndex].value);
  if(movingCalc.inputs.service_type == "load_unload"){
    document.getElementById("additional_locs").style.display = "block";
  } else {
    document.getElementById("additional_locs").style.display = "hidden";
  }
  movingCalc.setElementValue("third_location","Burnsville, MN, United States");
}

document.getElementById("vehicle_size").onblur=function()         
{
  movingCalc.setElementValue("vehicle_size",this.options[this.selectedIndex].value)
}

document.getElementById("percent_full").onblur=function()         
{
  movingCalc.setElementValue("percent_full",this.options[this.selectedIndex].value)
}

document.getElementById("truck_distance").onblur=function()         
{
  movingCalc.setElementValue("truck_distance",this.options[this.selectedIndex].value)
}

document.getElementById("movers").onblur=function()         
{
  movingCalc.setElementValue("movers",this.options[this.selectedIndex].value)
}

document.getElementById("elevator").onblur=function()
{
   movingCalc.setElementValue("elevator",this.checked)
}

document.getElementById("floors").onblur=function()
{
   movingCalc.setElementValue("floors",this.value)
}

document.getElementById("disassembly").onblur=function()
{
   movingCalc.setElementValue("disassembly",this.value)
}

document.getElementById("first_location").onblur=function()
{
   movingCalc.setElementValue("first_location",this.value);
}

document.getElementById("second_location").onblur=function()
{
   movingCalc.setElementValue("second_location",this.value)
}

var placeSearch, autocomplete1, autocomplete2;
var componentForm = {
  street_number: 'short_name',
  route: 'long_name',
  locality: 'long_name',
  administrative_area_level_1: 'short_name',
  country: 'long_name',
  postal_code: 'short_name'
};

function initialize() {
  // Create the autocomplete object, restricting the search
  // to geographical location types.
  autocomplete1 = new google.maps.places.Autocomplete(
      /** @type {HTMLInputElement} */(document.getElementById('first_location')),
      { types: ['geocode'] });
  
  autocomplete2 = new google.maps.places.Autocomplete(
      /** @type {HTMLInputElement} */(document.getElementById('second_location')),
      { types: ['geocode'] });
}

function geolocate() {
  if (navigator.geolocation) {
    navigator.geolocation.getCurrentPosition(function(position) {
      var geolocation = new google.maps.LatLng(
          position.coords.latitude, position.coords.longitude);
      var circle = new google.maps.Circle({
        center: geolocation,
        radius: position.coords.accuracy
      });
      //autocomplete.setBounds(circle.getBounds());
    });
  }
}
