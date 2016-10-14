/**
* @file jQuery collection plugin that implements the input and model for two-dimensional keyboard navigation
* @author Ian McBurnie <ianmcburnie@hotmail.com>
* @version 0.0.2
* @requires jquery
* @requires jquery-common-keydown
* @requires jquery-focus-exit
*/
(function($, window, document, undefined) {
    var pluginName = 'jquery-grid-navigation';

    /**
    * @method "jQuery.fn.gridNavigation"
    * @param {Object} cellsSelector - collection of navigable elements
    * @param {Object} [options]
    * @param {string} [options.activeIndex] - the initial active index (default: 0)
    * @param {boolean} [options.autoInit] - init the model when plugin executes (default: true)
    * @param {boolean} [options.autoReset] - reset the model when focus is lost (default: false)
    * @param {boolean} [options.autoWrap] - keyboard focus wraps from last to first & vice versa (default: false)
    * @param {boolean} [options.debug] - log debug info to console (default: false)
    * @fires gridNavigationInit - when the model intialises
    * @fires gridNavigationChange - when the current item changes
    * @fires gridNavigationReset - when the model resets
    * @fires gridNavigationBoundary - when a grid boundary is hit
    * @return {Object} chainable jQuery class
    */
    $.fn.gridNavigation = function gridNavigation(cellsSelector, options) {
        options = $.extend({
            activeIndex: 0,
            debug: false,
            autoWrap: false,
            autoReset: false,
            autoInit: true
        }, options);

        return this.each(function onEachGridNavigationWidget() {
            if ($.data(this, pluginName) === undefined) {
                var $widget = $(this);
                var $allCells = $widget.find(cellsSelector);
                var numCells = $allCells.length;
                var $rows = $allCells.first().parent().parent().children();
                var $cols = $rows.first().children();
                var numCols = $cols.length;
                var numRows = $rows.length;
                var currentCol = null;
                var currentRow = null;

                // ensure activeIndex is within bounds
                if (options.activeIndex < 0 || options.activeIndex >= numCells) {
                    options.activeIndex = 0;
                }

                var hasDoneInit = function() {
                    return currentCol !== null && currentCol !== null;
                };

                var needsInit = function() {
                    return options.autoInit === false && hasDoneInit() === false;
                };

                var storeData = function() {
                    // store index position on each cell
                    $allCells.each(function(idx, itm) {
                        $.data(itm, pluginName, {index: idx});
                    });
                };

                var getCellCoords = function(cell) {
                    var $cell = $(cell);

                    return {
                        col: $cell.index(),
                        row: $cell.parent().index()
                    };
                };

                var getCellIndex = function(cell) {
                    return (cell === null) ? null : $.data(cell, pluginName).index;
                };

                var getCellByIndex = function(index) {
                    return (index === null) ? null : $allCells.get(index);
                };

                var getCellByCoords = function(col, row) {
                    return (col !== null && row !== null) ? $rows.eq(row).children().eq(col).get(0) : null;
                };

                var resetModel = function() {
                    var fromCell = getCellByCoords(currentCol, currentRow);
                    var fromCellIndex = getCellIndex(fromCell);
                    var eventData = {
                        fromIndex: fromCellIndex,
                        toIndex: null
                    };

                    currentRow = null;
                    currentCol = null;

                    $(fromCell).trigger("gridNavigationReset", eventData);
                };

                var initModel = function() {
                    var fromCell = getCellByCoords(currentCol, currentRow);
                    var fromCellIndex = getCellIndex(fromCell);
                    var toCell = getCellByIndex(options.activeIndex);
                    var toCellCoords = getCellCoords(toCell);
                    var eventData;

                    if (fromCellIndex !== options.activeIndex) {
                        eventData = {
                            fromIndex: fromCellIndex,
                            toIndex: options.activeIndex
                        };

                        currentCol = toCellCoords.col;
                        currentRow = toCellCoords.row;

                        $(toCell).trigger("gridNavigationInit", eventData);
                    }
                };

                var onFocusExit = function(e) {
                    if (currentRow !== null && currentCol !== null) {
                        if (options.autoInit === false) {
                            resetModel();
                        } else {
                            initModel();
                        }
                    }
                };

                var updateModelByCoords = function(goToCol, goToRow) {
                    var currentCell = getCellByCoords(currentCol, currentRow);
                    var currentCellData = $.data(currentCell, pluginName);
                    var goToCell;
                    var goToCellData;
                    var boundary;
                    var eventData;

                    if (goToCol < 0) {
                        boundary = "left";
                        goToCol = numCols - 1;
                    } else if (goToCol >= numCols) {
                        boundary = "right";
                        goToCol = 0;
                    } else if (goToRow < 0) {
                        boundary = "top";
                        goToRow = numRows - 1;
                    } else if (goToRow >= numRows) {
                        boundary = "bottom";
                        goToRow = 0;
                    }

                    if (boundary !== undefined) {
                        eventData = {
                            fromIndex: currentCellData.index,
                            toIndex: null,
                            boundary: boundary
                        };
                        $(currentCell).trigger("gridNavigationBoundary", eventData);
                    }

                    if (boundary === undefined || options.autoWrap === true) {
                        goToCell = getCellByCoords(goToCol, goToRow);
                        goToCellData = $.data(goToCell, pluginName);

                        eventData = {
                            fromIndex: currentCellData.index,
                            toIndex: goToCellData ? goToCellData.index : null
                        };

                        $(goToCell).trigger("gridNavigationChange", eventData);

                        currentCol = goToCol;
                        currentRow = goToRow;
                    }
                };

                var updateModelByCol = function(colIndex) {
                    updateModelByCoords(colIndex, currentRow);
                };

                var updateModelByRow = function(rowIndex) {
                    updateModelByCoords(currentCol, rowIndex);
                };

                var updateModelByIndex = function(index) {
                    var $cell = $($allCells.get(index));
                    numCells = $allCells.length;
                    updateModelByCoords($cell.index(), $cell.parent().index());
                };

                var onGridNavigationItemsChange = function() {
                    $allCells = $widget.find(cellsSelector);
                    numCells = $allCells.length;
                    $rows = $allCells.first().parent().parent().children();
                    $cols = $rows.first().children();
                    numCols = $cols.length;
                    numRows = $rows.length;
                    storeData();
                };

                var onArrowKeyDown = function(e) {
                    if (needsInit() === true) {
                        initModel();
                    } else {
                        switch (e.type) {
                            case "upArrowKeyDown":
                                updateModelByRow(currentRow - 1);
                                break;
                            case "downArrowKeyDown":
                                updateModelByRow(currentRow + 1);
                                break;
                            case "leftArrowKeyDown":
                                updateModelByCol(currentCol - 1);
                                break;
                            case "rightArrowKeyDown":
                                updateModelByCol(currentCol + 1);
                                break;
                            default:
                                break;
                        }
                    }
                };

                // install commonKeyDown plugin to bound element
                $widget.commonKeyDown();

                // listen for arrow key events
                $widget.on('upArrowKeyDown downArrowKeyDown rightArrowKeyDown leftArrowKeyDown', onArrowKeyDown);

                // delegate cell click events to the widget
                $widget.on('click', cellsSelector, function(e) {
                    var $this = $(this);
                    if (needsInit() === true) {
                        initModel();
                    }
                    updateModelByCoords($this.index(), $this.parent().index());
                });

                if (options.autoReset === true) {
                    $widget.focusExit();
                    $widget.on('focusExit', onFocusExit);
                }

                // handle DOM update of navigation items
                $widget.on('gridNavigationItemsChange', onGridNavigationItemsChange);

                // we can set the intial active element if arrow key not required
                if (options.autoInit === true) {
                    setTimeout(function() {
                        initModel();
                    }, 0);
                }

                // store data on grid element
                jQuery.data(this, pluginName, {installed: 'true'});

                storeData();
            } else if (options.debug === true) {
                console.log('debug: {pluginName} is already installed on {element}'.replace('{pluginName}', pluginName).replace('{element}', this));
            }
        });
    };
}(jQuery, window, document));

/**
* The jQuery plugin namespace.
* @external "jQuery.fn"
* @see {@link http://learn.jquery.com/plugins/|jQuery Plugins}
*/

/**
* gridNavigationChange event
* @event gridNavigationChange
* @type {object}
* @property {object} event - event object
* @property {object} data - event data params
* @param {string} [data.fromIndex] - old collection idx position
* @param {string} [data.toIndex] - new collection idx position
*/

/**
* gridNavigationReset event
* @event gridNavigationReset
* @type {object}
* @property {object} event - event object
* @property {object} data - event data params
* @param {string} [data.fromIndex] - old collection idx position
* @param {string} [data.toIndex] - new collection idx position
*/

/**
* gridNavigationInit event
* @event gridNavigationInit
* @type {object}
* @property {object} event - event object
* @property {object} data - event data params
* @param {string} [data.fromIndex] - old collection idx position
* @param {string} [data.toIndex] - new collection idx position
*/

/**
* gridNavigationBoundary event
* @event gridNavigationBoundary
* @type {object}
* @property {object} event - event object
* @property {object} data - event data params
* @param {string} [data.boundary] - top, bottom, left or right
* @param {string} [data.fromIndex] - old collection idx position
* @param {string} [data.toIndex] - new collection idx position
*/
