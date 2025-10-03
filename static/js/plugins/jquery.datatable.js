/*!
 * jQuery DataTable Plugin
 * https://github.com/ddbase3/JqueryDataTable
 *
 * Lightweight, extensible data table plugin with paging, sorting, layout slots and modular renderers.
 * Part of the Contourz Photography ecosystem.
 *
 * Author: Daniel Dahme / BASE3 (https://base3.de)
 * License: LGPL (Lesser General Public License)
 */

(function ($) {

const defaultRenderers = {
        info: function ($el, { total, page, pageSize }) {
                const from = (page - 1) * pageSize + 1;
                const to = Math.min(page * pageSize, total);
                return $('<div class="jquerydatatable-info"></div>').text(`Records ${from} to ${to} of ${total}`);
        },

        pager: function ($el, { currentPage, pageSize, totalPages }) {
                const settings = $el.data('settings');
                const $frag = $(document.createDocumentFragment());
                for (let i = 1; i <= totalPages; i++) {
                        const $btn = $('<button type="button"></button>').text(i);
                        if (i === currentPage) $btn.attr('disabled', true);
                        $btn.on('click', function () {
                                settings.page = i;
                                $el.data('settings', settings).trigger('settingsChanged', [settings]);
                                loadData($el);
                        });
                        $frag.append($btn);
                }
                return $('<div class="jquerydatatable-pager"></div>').append($frag);
        },

        compactPager: function ($el, { currentPage, pageSize, totalPages }) {
                const settings = $el.data('settings');
                const $pager = $('<div class="datatable-pager" style="display: inline-flex; align-items: center; gap: 0.5em;"></div>');

                const $prev = $('<button type="button">← Prev</button>').prop('disabled', currentPage <= 1);
                const $next = $('<button type="button">Next →</button>').prop('disabled', currentPage >= totalPages);
                const $label = $(`<span>Page ${currentPage} of ${totalPages}</span>`);

                $prev.on('click', function () {
                        if (currentPage > 1) {
                                settings.page = currentPage - 1;
                                $el.data('settings', settings).trigger('settingsChanged', [settings]);
                                loadData($el);
                        }
                });

                $next.on('click', function () {
                        if (currentPage < totalPages) {
                                settings.page = currentPage + 1;
                                $el.data('settings', settings).trigger('settingsChanged', [settings]);
                                loadData($el);
                        }
                });

                $pager.append($prev, $label, $next);
                return $pager;
        },

        pageSizeSelector: function ($el) {
                const settings = $el.data('settings');
                const $select = $('<select class="jquerydatatable-per-page-selector"></select>');
                const options = settings.pageSizeOptions;
                const current = settings.pageSize;

                options.forEach(num => {
                        const $opt = $('<option></option>').val(num).text(`${num} per page`);
                        if (num === current) $opt.prop('selected', true);
                        $select.append($opt);
                });

                $select.on('change', function () {
                        settings.pageSize = parseInt($(this).val(), 10);
                        settings.page = 1;
                        $el.data('settings', settings).trigger('settingsChanged', [settings]);
                        loadData($el);
                });

                return $('<div class="jquerydatatable-per-page-container"></div>').append($select);
        },

        columnSelector: function ($el) {
                const settings = $el.data('settings');
                const $wrapper = $('<div class="jquerydatatable-column-selector-wrapper" style="position: relative; display: inline-block;"></div>');
                const $button = $('<button type="button" class="column-toggle-btn">Spalten ▾</button>');
                const $menu = $('<div class="column-toggle-menu" style="display:none; position:absolute; top:100%; left:0; z-index:1000; background:white; border:1px solid #ccc; padding:10px; box-shadow: 0 2px 6px rgba(0,0,0,0.2);"></div>');

                function updateAllCheckboxes(checked) {
                        settings.columns.forEach((col) => {
                                col.visible = checked;
                        });
                        $el.data('settings', settings).trigger('settingsChanged', [settings]);
                        updateColumnVisibility($el);
                        $menu.find('input[type="checkbox"]').not('.all-toggle').prop('checked', checked);
                }

                const $allLine = $('<div style="white-space:nowrap;"></div>');
                const $allOn = $('<button type="button">Alle ein</button>').on('click', function(e) {
                        updateAllCheckboxes(true);
                        e.stopPropagation();
                });
                const $allOff = $('<button type="button">Alle aus</button>').on('click', function(e) {
                        updateAllCheckboxes(false);
                        e.stopPropagation();
                });
                $allLine.append($allOn, $allOff);
                $menu.append($allLine, $('<hr style="margin:5px 0;">'));

                settings.columns.forEach((col) => {
                        const $label = $('<label style="display:block; margin-bottom: 4px; white-space: nowrap; cursor: pointer;"></label>');
                        const $checkbox = $('<input type="checkbox" name="' + col.key + '">')
                                .prop('checked', col.visible !== false)
                                .on('change', function (e) {
                                        col.visible = $(this).is(':checked');
                                        $el.data('settings', settings).trigger('settingsChanged', [settings]);
                                        updateColumnVisibility($el);
                                        e.stopPropagation();
                                });
                        $label.append($checkbox).append(' ' + col.label);
                        $menu.append($label);
                });

                $button.on('click', function (e) {
                        e.stopPropagation();
                        $menu.toggle();
                });

                $(document).on('click.jquerydatatable.columnselector', function () {
                        $menu.hide();
                });

                $menu.on('click', function (e) {
                        e.stopPropagation();
                });

                $wrapper.append($button, $menu);
                return $wrapper;
        },

        resetButton: function ($el) {
                const settings = $el.data('settings');
                const $btn = $('<button type="button" class="jquerydatatable-reset">Reset</button>');

                $btn.on('click', function () {
                        resetSettingsToDefault(settings);

                        $el.data('settings', settings);

                        $el.trigger('settingsChanged', [settings]);

                        renderTableHeader($el);
                        updateColumnVisibility($el);

                        renderLayoutTargets($el, {
                                filter: (key) => !settings.dynamicRenderers.includes(key)
                        });

                        loadData($el);
                });

                return $('<div class="jquerydatatable-reset-container"></div>').append($btn);
        },

        layout: function ($el) {
                const $wrapper = $('<div class="jquerydatatable-wrapper"></div>');

                const $header = $('<div class="jquerydatatable-header"></div>')
                        .append('<div class="left header-left"></div><div class="center header-center"></div><div class="right header-right"></div>');

                const $footer = $('<div class="jquerydatatable-footer"></div>')
                        .append('<div class="left footer-left"></div><div class="center footer-center"></div><div class="right footer-right"></div>');

                const $table = $('<table class="jquerydatatable-table"><thead></thead><tbody></tbody></table>');

                $wrapper.append($header, $table, $footer);
                return $wrapper;
        },

        tableHeader: function ($el, columns, settings) {
                const $thead = $('<thead></thead>');

                const $headerRow = settings.renderers.row(null, 'header');
                columns.forEach(col => {
                        const $th = settings.renderers.cell(null, col, null, 'header');
                        if (!$th) return;

                        const $content = settings.renderers.headerCell(col, settings);
                        $th.append($content);

                        $th.on('click', () => {
                                const newDir = (settings.sortColumn === col.key && settings.sortDirection === 'asc') ? 'desc' : 'asc';
                                settings.sortColumn = col.key;
                                settings.sortDirection = newDir;
                                $el.data('settings', settings).trigger('settingsChanged', [settings]);
                                const $thead = settings.renderers.tableHeader($el, columns, settings);
                                $el.find('thead').replaceWith($thead);
                                loadData($el);
                        });

                        $headerRow.append($th);
                });
                $thead.append($headerRow);

                const $filterRow = settings.renderers.row(null, 'filter');
                columns.forEach(col => {
                        const $th = settings.renderers.cell(null, col, null, 'filter');
                        if (!$th) return;
                        const $filter = settings.renderers.filterCell(col, settings, $el);
                        $th.append($filter);
                        $filterRow.append($th);
                });
                $thead.append($filterRow);

                return $thead;
        },

        tinyTableHeader: function ($el, columns, settings) {
                const $thead = $('<thead></thead>');
                const $headerRow = settings.renderers.row(null, 'header');

                columns.forEach(col => {
                        const $th = settings.renderers.cell(null, col, null, 'header');
                        if (!$th) return;
                        const $content = settings.renderers.headerCell(col, settings);
                        $th.append($content);
                        $headerRow.append($th);
                });

                $thead.append($headerRow);
                return $thead;
        },

        headerCell: function (col, settings) {
                const isSorted = settings.sortColumn === col.key;
                const direction = settings.sortDirection;
                const $label = $('<span></span>').text(col.label).css('white-space', 'nowrap');
                const $indicator = $('<span style="margin-left: 4px;"></span>');
                if (isSorted) $indicator.text(direction === 'asc' ? '▲' : '▼');
                return $('<span></span>').append($label, $indicator);
        },

        filterCell: function (col, settings, $el) {
                let debounceTimeout = null;
                const $wrapper = $('<div style="position: relative; width: 100%;"></div>');
                const $input = $('<input type="text" placeholder="Filter..." style="width: 100%; box-sizing: border-box; padding-right: 18px;">');
                const $reset = $('<span title="Reset filter" style="position: absolute; right: 6px; top: 50%; transform: translateY(-50%); cursor: pointer; color: #aaa; font-size: 12px;">✖</span>');

                $input.on('input', function () {
                        const val = $(this).val();
                        clearTimeout(debounceTimeout);
                        debounceTimeout = setTimeout(() => {
                                settings.filters = settings.filters || {};
                                settings.filters[col.key] = val;
                                settings.page = 1;
                                $el.data('settings', settings).trigger('settingsChanged', [settings]);
                                loadData($el);
                        }, 300);
                        $reset.toggle(!!val);
                });

                $reset.on('click', function () {
                        $input.val('').trigger('input');
                });

                $reset.hide();
                $wrapper.append($input, $reset);
                return $wrapper;
        },

        filterCellSelect: function (col, settings, $el) {
                const $select = $('<select style="width:100%; box-sizing:border-box;"></select>');
                const options = col.options || [];
                $select.append('<option value="">Alle</option>');
                options.forEach(opt => {
                        $select.append(`<option value="${opt.value}">${opt.label}</option>`);
                });

                $select.on('change', function () {
                        settings.filters = settings.filters || {};
                        settings.filters[col.key] = $(this).val();
                        settings.page = 1;
                        $el.data('settings', settings).trigger('settingsChanged', [settings]);
                        loadData($el);
                });

                return $select;
        },

        valueCell: function (row, column, value) {
                if (value === undefined && column && column.key) {
                        value = row[column.key];
                }
                return $('<span></span>').text(value ?? '');
        },

        cell: function (row, column, value, type) {
                const $cell = type === 'value' ? $('<td></td>') : $('<th></th>');
                return $cell.attr('data-key', column.key).css('cursor', type === 'header' ? 'pointer' : 'default');
        },

        row: function (row, type) {
                return $('<tr></tr>');
        }
};

defaultRenderers.info.isDynamic = true;
defaultRenderers.pager.isDynamic = true;
defaultRenderers.compactPager.isDynamic = true;

const methods = {
        init: function (options) {
                return this.each(function () {
                        const $el = $(this);
                        const settings = $.extend(true, {
                                dataSource: null,
                                data: null,
                                columns: [],
                                sortColumn: '',
                                sortDirection: 'asc',
                                pageSizeOptions: [10, 20, 50],
                                pageSize: 10,
                                page: 1,
                                onRowClick: null,
                                layoutTargets: {
                                        '.footer-right': ['pager'],
                                        '.footer-left': ['pageSizeSelector'],
                                        '.footer-center': ['info'],
                                        '.header-right': ['resetButton'],
                                        '.header-left': ['columnSelector']
                                },
                                renderers: {}
                        }, options);

                        settings._initialSettings = $.extend(true, {}, settings);

                        settings.renderers = $.extend({}, defaultRenderers, settings.renderers);

                        const usedRenderers = new Set(Object.values(settings.layoutTargets).flat());
                        settings.dynamicRenderers = [...usedRenderers].filter(key => {
                                const renderer = settings.renderers[key];
                                return renderer && renderer.isDynamic === true;
                        });

                        settings.columns = settings.columns.map((col, i) => {
                                if (!col.key) col.key = 'col' + i;
                                if (typeof col.visible === 'undefined') col.visible = true;
                                return col;
                        });

                        settings.filters = {};
                        settings.page = 1;

                        $el.data('settings', settings);
                        renderTable($el);
                        loadData($el);
                        $el.trigger('settingsChanged', [settings]);
                });
        },

        getSettings: function () {
                return this.data('settings');
        },

        updateSettings: function (newSettings) {
                return this.each(function () {
                        const $el = $(this);
                        const currentSettings = $el.data('settings') || {};
                        const updatedSettings = $.extend(true, {}, currentSettings, newSettings);
                        $el.data('settings', updatedSettings);
                        renderTable($el);
                        loadData($el);
                        $el.trigger('settingsChanged', [updatedSettings]);
                });
        },

        reload: function () {
                return this.each(function () {
                        loadData($(this));
                });
        }
};

function updateColumnVisibility($el) {
        const settings = $el.data('settings');
        const $table = $el.find('table');

        settings.columns.forEach((col) => {
                const key = col.key;
                if (!key) return;
                const visible = col.visible !== false;
                $table.find(`[data-key="${key}"]`).toggle(visible);
        });
}

function renderTable($el) {
        const settings = $el.data('settings');

        const $wrapper = settings.renderers.layout($el);
        $el.empty().append($wrapper);

        renderTableHeader($el);

        renderLayoutTargets($el, {
                filter: (key) => !settings.dynamicRenderers.includes(key)
        });

        updateColumnVisibility($el);
}

function renderTableHeader($el) {
        const settings = $el.data('settings');
        const $thead = settings.renderers.tableHeader($el, settings.columns, settings);
        $el.find('thead').replaceWith($thead);
}

function wrapWithRendererId(rendererKey, $content) {
        return $('<div></div>')
                .attr('data-renderer', rendererKey)
                .append($content);
}

function renderLayoutTargets($el, options = {}) {
        const settings = $el.data('settings');
        const { renderData = {}, filter = null } = options;

        Object.entries(settings.layoutTargets).forEach(([region, componentKeys]) => {
                const $target = $el.find(region);
                if (!$target.length) return;

                componentKeys.forEach(component => {
                        if (filter && !filter(component)) return;

                        const renderer = settings.renderers[component];
                        if (typeof renderer !== 'function') return;

                        const rendered = renderer($el, renderData);
                        if (!(rendered instanceof $)) return;

                        const $existing = $target.find(`[data-renderer="${component}"]`);
                        const $wrapped = wrapWithRendererId(component, rendered);

                        if ($existing.length) {
                                $existing.replaceWith($wrapped);
                        } else {
                                $target.append($wrapped);
                        }
                });
        });
}

function applyFilters(data, filters) {
        if (!filters || Object.keys(filters).length === 0) return data;
        return data.filter(row =>
                Object.entries(filters).every(([key, value]) =>
                        (row[key] || '').toString().toLowerCase().includes(value.toLowerCase())
                )
        );
}

function applySorting(data, column, direction) {
        if (!column) return data;
        return [...data].sort((a, b) => {
                const aVal = a[column];
                const bVal = b[column];
                if (aVal < bVal) return direction === 'asc' ? -1 : 1;
                if (aVal > bVal) return direction === 'asc' ? 1 : -1;
                return 0;
        });
}

function paginate(data, page, pageSize) {
        const start = (page - 1) * pageSize;
        const items = data.slice(start, start + pageSize);
        const totalPages = Math.ceil(data.length / pageSize);
        return { items, totalPages };
}

function loadData($el) {
        const settings = $el.data('settings');
        const filters = settings.filters || {};
        const pageSize = settings.pageSize;
        const page = settings.page;

        const params = {
                sort: settings.sortColumn,
                direction: settings.sortDirection,
                pageSize,
                page,
                filter: filters
        };

        const render = (response) => {
                const rows = response.data || response.websites || [];
                const $tbody = $el.find('tbody');
                $tbody.empty();

                rows.forEach(row => {
                        const $tr = settings.renderers.row(row, 'value');
                        settings.columns.forEach(col => {
                                const value = row[col.key];
                                const $cell = settings.renderers.cell(row, col, value, 'value');
                                if (!$cell) return;
                                const $content = settings.renderers.valueCell(row, col, value);
                                $cell.append($content);
                                $tr.append($cell);
                        });
                        if (typeof settings.onRowClick === 'function') {
                                $tr.css('cursor', 'pointer').on('click', () => settings.onRowClick(row));
                        }
                        $tbody.append($tr);
                });

                renderLayoutTargets($el, {
                        renderData: {
                                total: response.total,
                                page: response.page,
                                pageSize: response.pageSize,
                                currentPage: response.page,
                                totalPages: response.totalPages
                        },
                        filter: (key) => settings.dynamicRenderers.includes(key)
                });

                updateColumnVisibility($el);
        };

        if (Array.isArray(settings.data)) {
                const filtered = applyFilters(settings.data, filters);
                const sorted = applySorting(filtered, settings.sortColumn, settings.sortDirection);
                const paginated = paginate(sorted, page, pageSize);

                render({
                        data: paginated.items,
                        total: filtered.length,
                        page,
                        pageSize,
                        totalPages: paginated.totalPages
                });
        } else if (typeof settings.dataSource === 'string') {
                $.getJSON(settings.dataSource, params, function (response) {
                        render(response);
                });
        } else {
                console.warn('No data or dataSource defined for this datatable.');
        }
}

function resetSettingsToDefault(settings) {
        const original = settings._initialSettings;

        settings.filters = $.extend(true, {}, original.filters);
        settings.sortColumn = original.sortColumn;
        settings.sortDirection = original.sortDirection;
        settings.pageSize = original.pageSize;
        settings.page = original.page ?? 1;

        settings.columns.forEach((col, i) => {
                col.visible = original.columns[i]?.visible !== false;
        });

        return settings;
}

$.fn.jqueryDataTable = function (method) {
        if (methods[method]) {
                return methods[method].apply(this, Array.prototype.slice.call(arguments, 1));
        } else if (typeof method === 'object' || !method) {
                return methods.init.apply(this, arguments);
        } else {
                $.error('Method ' + method + ' does not exist on jqueryDataTable');
        }
};

$.fn.jqueryDataTable.renderers = defaultRenderers;

})(jQuery);

