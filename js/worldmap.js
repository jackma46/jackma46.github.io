/**
 * WorldMap Module
 */
var WorldMap = (function(){
    
    const MAX_SELECTED_COUNTRIES = 4;

    const ALERT_MESSAGE = "You can't select more countries!\nTo start a new group from scratch try Control + Left Click"
    const NOT_SELECTED_COUNTRY_COLOR = "#A8A39D"

    const width = 2400,
        height = 1000;

    let svg;
    
    /**
     * Initializes the Worldmap Entity.
     */
    var initialize = function() {
        // Define size of map group
        // Full world map is 2:1 ratio
        // Using 12:5 because we will crop top and bottom of map
        let minZoom,
            maxZoom,
            midX,
            midY,
            currentX,
            currentY,
            currentZoom;
    
        // Define map projection
        let projection = d3.geoMercator()
            .center([0, 20]) // set centre to further North as we are cropping more off bottom of map
            .scale([width / (2 * Math.PI)]) // scale to fit group width
            .translate([width / 2, height / 2]); // ensure centred in group;
    
        // Define map path
        let path = d3.geoPath()
            .projection(projection);
    
        // Define map zoom behaviour
        let zoom = d3.zoom()
            .on("zoom", zoomed);
    
        //offsets for tooltips
        let c = document.getElementById('worldmap'),
            offsetL = c.offsetLeft+20,
            offsetT = c.offsetTop+10,
            tooltip = d3.select("#worldmap").append("div").attr("class", "tooltip hidden");
    
        function initiateZoom() {
            // Define a "minzoom" whereby the "Countries" is as small possible without leaving white space at top/bottom or sides  
            minZoom = Math.max( 2 * $("#worldmap").width() / width, 2 * $("#worldmap").height() / height);
    
            maxZoom = 20 * minZoom;
    
            // define X and Y offset for centre of map to be shown in centre of holder
            midX = ($("#worldmap").width() - (minZoom * width)) / 2;
            midY = ($("#worldmap").height() - (minZoom * height)) / 2;
            zoom
                // set minimum extent of zoom to "minzoom", set max extent to a suitable factor of this value 
                .scaleExtent([minZoom, 10 * minZoom])
                // set translate extent so that panning can't cause map to move out of viewport 
                .translateExtent([[0, 0], [width, height]]);
    
            // change zoom transform to min zoom and centre offsets
            svg.call(zoom.transform, d3.zoomIdentity.translate(midX, midY).scale(minZoom));
        }
        // on window resize
        $(window).resize(function () {
            // Resize SVG
            svg.attr("width", $("#worldmap").width())
              .attr("height", $("#worldmap").height());
    
            initiateZoom();
        });
    
        // create an SVG
        var svg = d3.select("#worldmap")
            .append("svg")
            // set to the same size as the "map-holder" div
            .attr("width", $("#worldmap").width()-10)
            .attr("height", $("#worldmap").height()-10)
            .attr("fill", "rgb(255,255,255)")
            
            // add zoom functionality 
            .call(zoom);
    
        function getTextBox(selection) {
            selection.each(function (d) { d.bbox = this.getBBox(); })
        }
        
        //diagonal patten (for non-selectable countries)
        svg.append('defs')
            .append('pattern')
            .attr('id', 'diagonalHatch')
            .attr('patternUnits', 'userSpaceOnUse')
            .attr('width', 4)
            .attr('height', 4)
            .append('path')
            .attr('d', 'M-1,1 l2,-2 M0,4 l4,-4 M3,5 l2,-2')
            .attr('stroke', '#000000')
            .attr('stroke-width', 1);
        
        // get map data
        d3.json("js/worldmap/simple_map.json").then(function (json) {
            //Bind data and create one path per GeoJSON feature
            countriesGroup = svg.append("g")
                .attr("id", "map");
    
            // draw a path for each feature/country
            countries = countriesGroup.selectAll("path")
                .data(json.features).enter()
                .append("path")
                .attr("d", path)
                .attr("stroke", function() { return getCSSColor('--main-dark-color') })
                .attr("class", function (d) {
                    if(convertNameToIOCCode(d.properties.name_long) == -1) 
                        return "non-selectable-country";
                    else {
                        if(convertNameToIOCCode(d.properties.name_long) == countrySelection[0]) {
                            return "country country-on";
                        } else {
                            return "country";
                        }
                    }
                })
                .attr("fill", function(d) {
                    if (d3.select(this).classed("non-selectable-country")) {
                        return "url(#diagonalHatch)";
                    } if (d3.select(this).classed("country country-on")) {
                        return getColor(convertNameToIOCCode(d.properties.name_long));
                    } else {
                        return NOT_SELECTED_COUNTRY_COLOR;
                    }
                })
                // add a mouseover action to show name label for feature/country
                .on("mouseover", function (d) {
                    d3.select(this).attr("stroke", function() { return getCSSColor('--main-white-color') })
                        .style("cursor", function(d) {
                            if(d3.select(this).classed("non-selectable-country")) {
                                return "default";
                            } else {
                                return "pointer";
                            }
                        });

                    // Make this one the top of the stack for the lines.
                    this.parentElement.appendChild(this);
    
                    let mouseCoordinates = d3.mouse(svg.node()).map(function(d) { 
                        return parseInt(d); 
                    });
                    
                    tooltip.classed("hidden", false)
                        .attr("style", "left:"+(mouseCoordinates[0]+offsetL)+"px;top:"+(mouseCoordinates[1]+offsetT)+"px")
                        .html(d.properties.name);
                })
                .on("mouseout", function (d) {
                    d3.select(this).attr("stroke", function() 
                        { return getCSSColor('--main-dark-color') 
                    });
    
                    tooltip.classed("hidden", true)
                        .style("cursor", "default");
                })
                .on("click", function (d) {
                    if (d3.select(this).classed("country")) {
                        if(d3.event.ctrlKey) {
                            if (d3.select(this).classed("country-on")) {
                                zoomOut();
                            }
                            else {
                                d3.selectAll(".country").classed("country-on", false)
                                    .attr("fill", function(d) {
                                    return NOT_SELECTED_COUNTRY_COLOR;
                                });
    
                                d3.select(this).classed("country-on", true);
                                   
                                boxZoom(path.bounds(d), path.centroid(d), 20);
                                
                                // Change country first so fill color can be correctly updated
                                changeSelectedCountry(d.properties.name_long);

                                d3.select(this).attr("fill", function(d) {
                                    return getColor(convertNameToIOCCode(d.properties.name_long));
                                });
                            }
                        }
                        if (!(getNumberOfCountriesInSelection() == 1 
                          && countrySelection.includes(convertNameToIOCCode(d.properties.name_long)))) {
                            if(d3.select(this).classed("country-on")) {
                                d3.select(this).classed("country-on", false)
                                    .attr("fill", function(d) {
                                    return NOT_SELECTED_COUNTRY_COLOR;
                                });
    
                                removeCountryFromSelection(d.properties.name_long);
                            }
                            else {
                                if (getNumberOfCountriesInSelection() < MAX_SELECTED_COUNTRIES) {
                                    addCountryToSelection(d.properties.name_long);
                                    d3.select(this).classed("country-on", true)
                                        .attr("fill", function(d) {
                                            return getColor(convertNameToIOCCode(d.properties.name_long));
                                        });
                                } else {
                                    alert(ALERT_MESSAGE);
                                }
                            }
                        }
                    }
                });
            initiateZoom();
        });
    
        // apply zoom to countriesGroup
        function zoomed() {
            t = d3.event.transform;
            countriesGroup.attr(
                "transform", "translate(" + [t.x, t.y] + ")scale(" + t.k + ")"
            );   
        }
    
        function zoomOut() {
            svg.transition()
                .duration(500)
                .call(zoom.transform, d3.zoomIdentity.translate(midX, midY).scale(minZoom));
        };
    
        // zoom to show a bounding box, with optional additional padding as percentage of box size
        function boxZoom(box, centroid, paddingPerc) {
            let svg_width = $("#worldmap").width() - 10;
            let svg_height = $("#worldmap").height() - 10;
            
            minXY = box[0];
            maxXY = box[1];
            
            // find size of map area defined
            zoomWidth = Math.abs(minXY[0] - maxXY[0]);
            zoomHeight = Math.abs(minXY[1] - maxXY[1]);
            
            // find midpoint of map area defined
            zoomMidX = centroid[0];
            zoomMidY = centroid[1];
            currentX = centroid[0];
            currentY = centroid[1];
            
            // increase map area to include padding
            zoomWidth = zoomWidth * (1 + paddingPerc / 100);
            zoomHeight = zoomHeight * (1 + paddingPerc / 100);
    
            // find scale required for area to fill svg
            maxXscale = svg_width / zoomWidth;
            maxYscale = svg_height / zoomHeight;
            zoomScale = Math.min(maxXscale, maxYscale);
            
            // handle some edge cases
            // limit to max zoom (handles tiny countries)
            zoomScale = Math.min(zoomScale, maxZoom);
            
            // limit to min zoom (handles large countries and countries that span the date line)
            zoomScale = Math.max(zoomScale, minZoom);
            
            // Find screen pixel equivalent once scaled
            offsetX = zoomScale * zoomMidX;
            offsetY = zoomScale * zoomMidY;
    
            // Find offset to centre, making sure no gap at left or top of holder
            dleft = Math.min(0, svg_width / 2 - offsetX);
            dtop = Math.min(0, svg_height/ 2 - offsetY);
            
            // Make sure no gap at bottom or right of holder
            dleft = Math.max(svg_width - width * zoomScale, dleft);
            dtop = Math.max(svg_height - height * zoomScale, dtop);
            // set zoom
            currentZoom = zoomScale;
            svg.transition()
                .duration(500)
                .call(zoom.transform,d3.zoomIdentity.translate(dleft, dtop).scale(zoomScale));
        }
    }

    return {
        initialize:initialize
    };

})();

