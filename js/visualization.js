// global variables
var selectedNode = null,
    currentState = 0,   // defines the deepness we're seeing in the vis (All = 0, Sport = 1; Discipline = 2; Event = 3)
    countrySelection = [null, null, null, null],
    sportFilter = "All",
    disciplineFilter = "All",
    eventFilter = "All",
    yearFilter = {initial: 1896, end: 2012}
    currentFilterKeyword = "Sport",
    countryNameDictionary = {},
    iocCodeDictionary = {};


// colors used throughout the visualization
const eventsColors = d3.scaleOrdinal(d3.schemeSet3),
    countryColors = ["#fb8072", "#ffffb3", "#8dd3c7", "#bebada"];

// array containing the years in which summer olympics occurred
const years = [1896, 1900, 1904, 1908, 1912, 1920, 1924, 1928, 1932, 1936, 1948, 1952, 1956, 1960, 1964, 1968, 1972, 1976, 1980, 1984, 1988, 1992, 1996, 2000, 2004, 2008, 2012]

// animation variables
const animationTime = 750;

// set a reload function on window resize
window.onresize = function(){ location.reload(); }

// First visualization drawing.
$(document).ready(function() {

    // Make the Dictionary Loader run asynchronously
    var callback = $.Deferred();
    loadDictionary(callback);

    callback.done(function() {
        updateDashboardState(0,true);
    });
    
});

/**
 * Main function that updated the visualization according to user inputs.
 * @param {number} nextState - next state in the visualization, can only take the values -1, 0, 1
 * @param {boolean} initialUpdate - flag determining if its the first update (default = false)
*/
function updateDashboardState(nextState, initialUpdate = false) {

    switch(nextState){
        case -1:
            if(++currentState > 3) {
                currentState = 3;
                return;
            }
            break;
        case 1:
            if(--currentState < 0) {
                currentState = 0;
                return;
            }
            break;
    }

    if(initialUpdate) {
        TimeSlider.initialize();

        Bubblechart.initialize();
        WorldMap.initialize();
        Linechart.initialize();
        Scatterplot.initialize();

    } else {
        Bubblechart.update();
        Linechart.update();
        Scatterplot.update();
    }

    let yearsText = 
        (yearFilter.end == yearFilter.initial ? 
            " in <strong>" + yearFilter.initial + "</strong>" :
            " from <strong>" +  yearFilter.initial + "</strong> to <strong>" + yearFilter.end + "</strong>"
        );
    let countriesSection = countrySelectionToString();

    switch(currentState) {
        case 0:
            sportFilter = "All";
            currentFilterKeyword = "Sport";
            $('#statelabel').html(
                countriesSection + " on <strong> every Event </strong>" + yearsText
            );
            $('#back-icon-container').hide();
            break;

        case 1:
            sportFilter = selectedNode.Sport;
            currentFilterKeyword = "Discipline";
            $('#statelabel').html(
                countriesSection  + " on <strong>" + sportFilter + "</strong>" + yearsText
            );
            $('#back-icon-container').show();
            $('#back-subtitle').text("All");
            break;

        case 2:
            disciplineFilter = selectedNode.Discipline;
            currentFilterKeyword = "Event";
            $('#statelabel').html(
                countriesSection  + " on <strong>" + disciplineFilter + "</strong>" + yearsText
            );
            $('#back-subtitle').text(sportFilter);
            break;

        case 3:
            eventFilter = selectedNode.Event;
            currentFilterKeyword = "Event";
            $('#statelabel').html(
                countriesSection  + " on <strong>" + eventFilter + "</strong>" + yearsText
            );
            $('#back-subtitle').text(disciplineFilter);
            break;
    }
}


/** 
 * Initializes the internal dicionary objects
 */
var loadDictionary = function(callback) {
    d3.csv("csv/dictionary.csv").then(function(data){

        data.forEach((element) => {
            countryNameDictionary[element.CountryName] = element.CountryCode;
            iocCodeDictionary[element.CountryCode] = element.CountryName;
        });

         randomizeInitialCountry(data, "FRA");

         callback.resolve();
    })
};

/** 
 * Selects a random country to be the initial selected 
 * 
 * @param {array} array - Array containing a CountryName <-> CountryCode relationship
 * (see loadDictionary())
 * @param {array} initialCountryCode - IOC Code of the country to be the initial one,
 * optional paramenter defaults to null, no checks are made to this parameter
 */
function randomizeInitialCountry(array, initialCountryCode = null) {
    
    let randomCountryCode;
    
    if(initialCountryCode === null) {
        randomCountryCode = array[Math.floor(Math.random() * array.length)].CountryCode;
    } else {
        randomCountryCode = initialCountryCode;
    }

    countrySelection = [randomCountryCode, null, null, null];
}

/** 
 * Converts a country name to the IOC code 
 * 
 * @param {string} countryName - Name to be converted to a IOC Code
 * @returns {string} IOC Code or -1 if name doesn't exist in dictionary
 */
function convertNameToIOCCode(countryName) {
    if(countryNameDictionary[countryName]) {
        return countryNameDictionary[countryName];
    } else {
        return -1;
    }
}
/** 
 * converts a IOC code to the country name 
 * @param {string} code - IOC Code to be converted into a country name
 * @returns {string} Country Name or -1 if the given code doesn't exist in dictionary
 */
function convertIOCCodeToName(code) {
    return (iocCodeDictionary[code] ? iocCodeDictionary[code] : -1);
}

/** 
 * Returns the number of countries currently in the selection
 * (basically not null values)
 * @returns {number} Number of countries (from 1 to 4)
 */
function getNumberOfCountriesInSelection() {
	let number = 0;
	countrySelection.forEach((element) => {
		if(element === null) {
            number++;
        }
    });
    
	return countrySelection.length - number;
}

/** 
 * Returns the first free position in the countrySelection array
 * @returns {number} Open Position or -1 if the array is filled
 */
function getFirstOpenPositionInSelection() {
    let n = countrySelection.length;

    for(let i = 0; i < n; i++) {
        if(countrySelection[i] === null) {
            return i;
        }
    };
    
    return -1;
}

/** 
 * Converts the countrySelection variable to something a 
 * human can read, with some html marking
 * 
 * Example:
 * 
 *  *"country1, country2 and country3"*
 * 
 * @returns {string} String
 */
function countrySelectionToString() {
    
    let string = "",            
        counter = 0;

    // Cicle through the countries in countrySelection.
    countrySelection.forEach((element, i) => {
		if(element === null) {
            return;
        }

        string += "<strong>" + convertIOCCodeToName(element) + "</strong>";
        counter++;

        switch(getNumberOfCountriesInSelection() - counter) {
            case 0:
                string += "";
                break;

            case 1:
                string += " and ";
                break;

            default:
                string += ", "
                break;
        }
    });
    return string;
}

/** 
 * Changes the currently selected country to a new one
 * 
 * @param {string} countryName - Name of the new country
 */
function changeSelectedCountry(countryName) {
    countrySelection = [String(convertNameToIOCCode(countryName)), null, null, null];

    updateDashboardState(0, false, true);
};

/** 
 * Adds a new country to the current selection
 * 
 * @param {string} countryName - Name of the country to be added
 */
function addCountryToSelection(countryName) {
	countrySelection[getFirstOpenPositionInSelection()] = String(convertNameToIOCCode(countryName));

    updateDashboardState(0);
}

/** 
 * Removes a country to the current selection
 * 
 * @param {string} countryName - Name of the country to be removed
 */
function removeCountryFromSelection(countryName){
	countrySelection[countrySelection.indexOf(String(convertNameToIOCCode(countryName)))] = null;

    updateDashboardState(0);
}

function changeTimeline(begin, end){
    // Check if a update is necessary.
    if(yearFilter.initial != years[Math.round(begin)] || yearFilter.end != years[Math.round(end)]) {
        yearFilter.initial = years[Math.round(begin)];
        yearFilter.end = years[Math.round(end)];
    
        updateDashboardState(0);
    }
};

function checkIfTimelineIsBetween(begin, end){
    return (begin <= yearFilter.initial && end >= yearFilter.initial && begin <= yearFilter.end &&  end >= yearFilter.end);
}

// function assumes we never use a year outside of year array
function checkIfYearInInterval(year){
    return (year >= yearFilter.initial && year <= yearFilter.end);
};

// function to get a CSS variable from the CSS
function getCSSColor(variable){
    return getComputedStyle(document.body).getPropertyValue(variable);
};

// descending filter compararation function
function descending(a,b) { return a.key - b.key };

/**
 * Returns a color from a set array of 4, used to color countries throughout the visualization
 * @param {*} countryCode String containing the country code
 */
function getColor(countryCode) {
    var index =  countrySelection.findIndex(el => el === countryCode);

    return ((index == -1) ? "D2D4D3" : countryColors[index]);
}