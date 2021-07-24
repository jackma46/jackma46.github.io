# Olympics Visualization

![screenshot](https://github.com/DanyBoss/Olympics-Visualization/blob/master/res/preview.png?raw=true)
[Live Version](http://olympics.ayydany.space/)

## About
This is a web visualization of Olympic data from 1896 until 2012. 
It currrently only features data from the Summer Olympics, but adding data from Winter Olympics is planned for the future.

This visualization was initially developed as a project for the Masters Course Information Visualization at Lisbon Técnico but turned into sort of a hobby of mine.

## Usage
### Here's a quick rundown on how things work around here.

The main focus in this vizualization is the number of **Olympic Medals** won (unless  stated otherwise like in the **Scatterplot**) and comparing this number by several factors.

The visualization is split into 5 parts:
- **Time Slider** 
   - Serves as a time interval selector.
- **World Map** 
    - Literally a country selector.
- **Bubble Chart** 
    - Shows what events currently have medals according to the filters selected.
- **Scatterplot** 
    - Compares information regarding total country medals wons with the demography of said country.
- **Line Chart** 
    - Shows the evolution of medals won according to the filters selected.

Only the **Timer Slider**, **World Map** and **Bubble Chart** are interactable, the others serve as simple views. Any change to any filter (be it a Country, a specific event or another time interval) will cause the visualization to update according to the user requests.

## Credits
This visualization is made using HTML5, JS with help of [D3.js](https://d3js.org/) and [JQuery](https://jquery.com/)
