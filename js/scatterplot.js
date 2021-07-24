/**
 * Scatterplot Module
 */
var Scatterplot = (function(){

    let svg;

    const margin = {top: 50, right: 50, bottom: 50, left: 60},
        width = $("#scatterplot").width() - margin.right - 20,
        height = $("#scatterplot").height() - margin.top - margin.bottom;

        // Axis variables initialization.
        const xScale = d3.scaleLinear()
            .range([0, width]);
        
        const yScale = d3.scaleLinear()
            .range([height, 0]);

        const xAxis = d3.axisBottom(xScale)
            .tickFormat(d3.format("s"));

        const yAxis = d3.axisLeft(yScale);

        const zoom = d3.zoom()
            .scaleExtent([1, 5]);

        const tip = d3.tip()
            .attr('class', 'd3-tip')
            .offset([-15, 0])
            .html(d => "<strong>" + convertIOCCodeToName(d.key) + "</strong> has <strong>" + d.value[1] + "</strong> Total Medals");

    /**
     * Initializes a new scatterplot
     */
    var initialize = function() {
        
        svg = d3.select("#scatterplot").append("svg")
            .attr("width", width + margin.right + 20)
            .attr("height", height + margin.top + margin.bottom)
            .append("g")
            .attr("transform", "translate(" + margin.left + "," + margin.top + ")")
            .call(tip);

        processData().then(processedData => {
            xScale.domain(d3.extent(processedData.entries(), d => d.value[0])).nice();
            yScale.domain(d3.extent(processedData.entries(), d => d.value[1])).nice();
        
            // X Axis.
            svg.append("g")
                .attr("class", "xAxis unselectable")
                .attr("transform", "translate(0," + height + ")")
                .call(xAxis);
            
            svg.append("text")
                .attr("class", "axislabel unselectable")
                .attr("transform", "translate(" + (width / 2) + " ," + 
                                        (height + margin.top - 15) + ")")
                .style("text-anchor", "middle")
                .text("Population");
        
            // Y Axis.
            svg.append("g")
                .attr("class", "yAxis unselectable")
                .call(yAxis);

            svg.append("text")
                .attr("class", "axislabel unselectable")
                .attr("transform", "rotate(-90)")
                .attr("y", 0 - margin.left + 5)
                .attr("x",0 - (height / 2))
                .attr("dy", "1em")
                .style("text-anchor", "middle")
                .text("Medals");

            // Scatterplot points.
            svg.selectAll("dot")
                .data(processedData.entries())
                .enter().append("circle")
                .attr("class", d => (countrySelection.includes(d.key) ? "dot" : "dot hidden"))
                .attr("r", d => (countrySelection.includes(d.key) ? 10 : 5))
                .attr("cx", d => xScale(d.value[0]))
                .attr("cy", d => yScale(d.value[1]))
                .attr("stroke", d => getCSSColor('--main-dark-color'))
                .style("fill", d => getColor(d.key))
                .on('mouseover', function(d){
                    tip.show(d);
                    d3.select(this).transition()
                        .ease(d3.easeElastic)
                        .duration(animationTime)
                        .attr("r", d => (countrySelection.includes(d.key) ? 15 : 8))
                        .attr("stroke", d => getCSSColor('--main-white-color'))
                        .attr("stroke-width", 2);
                })
                .on('mouseout', function(d){
                    tip.hide(d);
                    d3.select(this).transition()
                        .ease(d3.easeElastic)
                        .duration(animationTime)
                        .attr("r", d => (countrySelection.includes(d.key) ? 10 : 5))
                        .attr("stroke", d => getCSSColor('--main-dark-color'))
                        .attr("stroke-width", 1);
                });
        });
    };

    var update = function() {
        processData().then(processedData => {
            xScale.domain(d3.extent(processedData.entries(), d => d.value[0])).nice();
            yScale.domain(d3.extent(processedData.entries(), d => d.value[1])).nice();

            // Update Axis.
            svg.select(".yAxis")
                .transition().duration(animationTime)
                .ease(d3.easeExp)
                .call(yAxis);

            svg.select(".xAxis")
                .transition().duration(animationTime)
                .ease(d3.easeExp)
                .call(xAxis);

            // Update all points.
            var dots = svg.selectAll(".dot")
                .data(processedData.entries());

            dots.transition()
                .duration(animationTime)
                .ease(d3.easeExp)
                .attr("class", d => (countrySelection.includes(d.key) ? "dot" : "dot hidden"))
                .attr("r", d => (countrySelection.includes(d.key) ? 10 : 5))
                .attr("cx",d => xScale(d.value[0]))
                .attr("cy", d => yScale(d.value[1]))
                .style("fill", d => getColor(d.key));
        });
    };

    var processData = function() {
        var promise = new Promise((resolve, reject) => {
            Promise.all([d3.csv("csv/world_population_full.csv"), d3.csv("csv/summer_year_country_event.csv")])
                .then(values => {

                    let population = values[0],
                        countries = values[1];
                    
                    let processedPopulation,
                        processedCountries;

                    processedPopulation = d3.nest()
                        .key(d => d.CountryCode)
                        .map(population);

                    // Calculate population average from the interval years.
                    processedPopulation.each((value,key) => {
                        let populationTotal = 0,
                            counter = 1;

                        Object.keys(value[0]).map(e => {
                            if((!isNaN(e)) && checkIfYearInInterval(e) && !(isNaN(value[0][e]))){
                                populationTotal = populationTotal + (+value[0][e] - populationTotal) / counter;
                                processedPopulation.set(key, Math.round(populationTotal));
                                counter++;
                            }
                        });
                    });

                    // Calculate total amount of medals won by each country in the interval years.
                    processedCountries = d3.nest()
                        .key(d => d.Country)
                        .rollup(leaves => {
                                switch(currentState) {
                                    case 0:
                                        return {
                                            "TotalMedals" : d3.sum(leaves, d => {
                                                if(checkIfYearInInterval(+d.Year)) {
                                                    return(+d.BronzeCount + +d.SilverCount + +d.GoldCount);
                                                }
                                            })
                                        };
                                        break;
                                    case 1:
                                        return {
                                            "TotalMedals" : d3.sum(leaves, d => {
                                                if(checkIfYearInInterval(+d.Year) && d.Sport == sportFilter) {
                                                    return(+d.BronzeCount + +d.SilverCount + +d.GoldCount);
                                                }
                                            })
                                        };
                                        break;
                                    case 2:
                                        return {
                                            "TotalMedals" : d3.sum(leaves, d => {
                                                if(checkIfYearInInterval(+d.Year) && d.Discipline == disciplineFilter) {
                                                    return(+d.BronzeCount + +d.SilverCount + +d.GoldCount);
                                                }
                                            })
                                        };
                                        break;
                                    case 3:
                                        return {
                                            "TotalMedals" : d3.sum(leaves, d => {
                                                if(checkIfYearInInterval(+d.Year) && d.Event == eventFilter) {
                                                    return(+d.BronzeCount + +d.SilverCount + +d.GoldCount);
                                                }
                                            })
                                        };
                                        break;
                                }   
                        })
                    .map(countries);

                let processedData = d3.map();

                processedPopulation.each((value,key) => {
                    processedData.set(String(key), [value, processedCountries.get(String(key)).TotalMedals]);
                });
                
                resolve(processedData); 
            });
        });
        return promise;
    };

    return {
        initialize: initialize,
        update: update
    };

})();