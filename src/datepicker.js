(function(global, factory) {

    global.DatePicker = factory()

}(this, function() {

'use strict';

var startTime = new Date();

var formatter = {
    format: {
        Y: function(d) { return '' + d.getFullYear(); },
        m: function(d) { return ('0' + (d.getMonth() + 1)).slice(-2); },
        d: function(d) { return ('0' + d.getDate()).slice(-2); }
    },
    regex: {
        Y: '(\\d{4})',
        m: '(\\d\\d?)',
        d: '(\\d\\d?)'
    },
    toNumber: {
        Y: function(val) { return parseInt(val, 10); },
        m: function(val) { return parseInt(val, 10); },
        d: function(val) { return parseInt(val, 10); }
    }
};

var defaultConfig = {
    dateFormat: '%Y-%m-%d',
    locale: 'en',
    firstDay: 0,
    minYear: 1900,
    maxYear: startTime.getFullYear() + 10
};

var L10N = {
    en: {
        weekdays: ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'],
        months: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']
    },

    ja: {
        weekdays: ['日', '月', '火', '水', '木', '金', '土'],
        months: ['1月', '2月', '3月', '4月', '5月', '6月', '7月', '8月', '9月', '10月', '11月', '12月'],
        yearSuffix: '年',
        showYearBeforeMonth: true
    }
};

var Template = [
'<div class="dp-content" data-dp-node-type="root">',
' <div class="dp-header">',
'  <table>',
'   <tr>',
'    <td class="dp-prev">',
'     <button data-dist="-1y" type="button"><i class="icon-angle-double-left"></i></button>',
'     <button data-dist="-1m" type="button"><i class="icon-angle-left"></i></button>',
'    </td>',
'    <td class="dp-view-date">',
'     <select class="dp-select-month"></select>',
'     <select class="dp-select-year"></select>',
'    </td>',
'    <td class="dp-next">',
'     <button data-dist="+1m" type="button"><i class="icon-angle-right"></i></button>',
'     <button data-dist="+1y" type="button"><i class="icon-angle-double-right"></i></button>',
'    </td>',
'   </tr>',
'  </table>',
' </div>',
' <div class="dp-calendar">',
'  <table>',
'   <thead class="dp-weekdays"></thead>',
'   <tbody class="dp-days"></tbody>',
'  </table>',
' </div>',
'</div>'
].join('\n');


var Fn = {
    extends: Object.assgin || function(dst) {
        for (var i = 0; i < arguments.length; i++) {
            var src = arguments[i];
            Object.keys(src).forEach(function(key) {
                dst[key] = src[key];
            });
        }
        return dst;
    },

    createElement: function(name, className, content) {
        var el = document.createElement(name);
        if (typeof className === 'string') {
            el.className = className
        }
        if (typeof content !== 'undefined') {
            el.textContent = content;
        }
        return el;
    },

    toViewDate: function(date) {
        var d = new Date(date);
        d.setDate(1);
        d.setHours(0, 0, 0, 0);
        return d;
    },

    dayFirst: function(date) {
        // set day to begining of the month
        var d = new Date(date);
        d.setDate(1);
        d.setHours(0, 0, 0, 0);
        return d;
    },

    dayLast: function(date) {
        // set day to end of month
        var d = new Date(date);
        d.setMonth(d.getMonth() + 1, 0);
        d.setHours(0, 0, 0, 0);
        return d;
    }
};

function DatePicker(config) {
    var self = this;

    function init() {
        self.open = open;
        self.close = close;
        self.destroy = destroy;

        self._handlers = [];
        self._events = {};

        self._date = null;
        self._viewdate = Fn.dayFirst(Date.now());

        setupConfig();
        createCalendar();
    }

    function setupConfig() {
        self._cfg = Fn.extends({}, defaultConfig, config || {});


        if (!self._cfg.L10N) {
            self._cfg.L10N = L10N[self._cfg.locale] || L10N[defaultConfig.locale];
        }

        if (typeof self._cfg.firstDay !== 'number') {
            self._cfg.firstDay = defaultConfig.firstDay;
        } else {
            self._cfg.firstDay = Math.floor(Math.abs(self._cfg.firstDay) % 7);
        }

        if (!(self._cfg.minDate instanceof Date)) {
            self._cfg.minDate = parseDateString(self._cfg.minDate, self._cfg.dateFormat);
        }
        if (!(self._cfg.maxDate instanceof Date)) {
            self._cfg.maxDate = parseDateString(self._cfg.maxDate, self._cfg.dateFormat);
        }

        ['onChange', 'onOpen', 'onClose'].forEach(function(event) {
            if (typeof self._cfg[event] === 'function') {
                self._events[event] = self._cfg[event];
            }
        });
    }

    function addEvent(el, eventName, handler, phase) {
        phase = Boolean(phase)
        self._handlers.push([el, eventName, handler, phase]);
        el.addEventListener(eventName, handler, phase);
    }

    function createCalendar() {
        self._container = Fn.createElement('div', 'dp-container dp-close');
        self._container.innerHTML = Template;

        (function() {
            var selecty = self._container.querySelector('.dp-select-year');
            var fragmenty = document.createDocumentFragment();
            for (var y = self._cfg.minDate.getFullYear(), maxy = self._cfg.maxDate.getFullYear(); y <= maxy; y++) {
                var option = Fn.createElement('option', null, y + (self._cfg.L10N.yearSuffix || ''));
                option.value = y;
                fragmenty.appendChild(option);
            }

            var selectm = self._container.querySelector('.dp-select-month');
            var fragmentm = document.createDocumentFragment();
            self._cfg.L10N.months.forEach(function(label, m) {
                var option = Fn.createElement('option', null, label);
                option.value = m + 1;
                fragmentm.appendChild(option)
            });

            if (self._cfg.L10N.showYearBeforeMonth) {
                selectm.parentNode.insertBefore(selecty, selectm);
            }
            selecty.appendChild(fragmenty);
            selectm.appendChild(fragmentm);

            addEvent(selecty, 'change', function(evt) {
                var el = evt.target;
                self._viewdate.setFullYear(el[el.selectedIndex].value);
                updateCalendar();
            });

            addEvent(selectm, 'change', function(evt) {
                var el = evt.target;
                self._viewdate.setMonth(el[el.selectedIndex].value - 1);
                updateCalendar();
            });
        }());

        (function(els) {
            var fn = {
                y: function(d, n) { d.setFullYear(d.getFullYear() + n); },
                m: function(d, n) { d.setMonth(d.getMonth() + n); }
            };
            Array.prototype.forEach.call(els, function(el) {
                var dist = el.dataset.dist;
                if (dist && /^[-+]?\d+[ym]$/.test(dist)) {
                    var fnx = fn[dist.slice(-1)];
                    el.dataset.distType = dist.slice(-1);
                    addEvent(el, 'click', function(evt) {
                        fnx(self._viewdate, parseInt(dist.slice(0, -1)));
                        updateCalendar();
                    });
                }
            });
        }(self._container.querySelectorAll('.dp-header [data-dist]')));

        (function(parent) {
            var tr = Fn.createElement('tr');
            var fd = self._cfg.firstDay;
            self._cfg.L10N.weekdays.forEach(function(_, n, wds) {
                var td = Fn.createElement('td', null, wds[(n + fd) % 7]);
                tr.appendChild(td);
            });
            parent.appendChild(tr);
        }(self._container.querySelector('.dp-weekdays')));

        (function(parent) {
            var fragment = document.createDocumentFragment();
            for (var i = 0; i < 6; i++) {
                fragment.appendChild(Fn.createElement('tr'));
            }
            parent.appendChild(fragment);
            addEvent(parent, 'click', function(evt) {
                var d = evt.target.dataset.date;
                if (d) {
                    setDate(d);
                    if (self._events.onChange) {
                        self._events.onChange(d);
                    }
                }
            });
        }(self._container.querySelector('.dp-days')));

        updateCalendar();

        (self._cfg.appendTo || document.body).appendChild(self._container);
    }

    function updateCalendar() {
        var format = self._cfg.dateFormat;
        var datestr = self._date ? self.formatDate(format, self._date) : '';
        var viewy = self._viewdate.getFullYear();
        var viewm = self._viewdate.getMonth();

        var miny = self._cfg.minDate.getFullYear(), minm = self._cfg.minDate.getMonth(), mint = self._cfg.minDate.getTime();
        var maxy = self._cfg.maxDate.getFullYear(), maxm = self._cfg.maxDate.getMonth(), maxt = self._cfg.maxDate.getTime();
        [
            ['.dp-prev [data-dist-type="y"]', viewy <= miny],
            ['.dp-prev [data-dist-type="m"]', viewy < miny || viewy === miny && viewm <= minm],
            ['.dp-next [data-dist-type="y"]', viewy >= maxy],
            ['.dp-next [data-dist-type="m"]', viewy > maxy || viewy === maxy && viewm >= maxm]
        ].forEach(function(x) {
            self._container.querySelector(x[0]).disabled = x[1];
        });

        self._container.querySelector('.dp-select-year').selectedIndex = Math.max(0, viewy - miny);
        self._container.querySelector('.dp-select-month').selectedIndex = viewm;

        var dx = new Date(self._viewdate);
        var wd = dx.getDay();
        var fd = self._cfg.firstDay;
        dx.setDate((1 + fd - wd) - (wd < fd ? 7 : 0));
        Array.prototype.forEach.call(self._container.querySelectorAll('.dp-days tr'), function(elold) {
            var elnew = Fn.createElement('tr');
            for (var wd = 0; wd < 7; wd++) {
                var t = dx.getTime();
                var d = dx.getDate();
                var el = Fn.createElement('td', null, d);
                if (mint <= t && t <= maxt) {
                    var eldata = self.formatDate(format, dx);
                    el.dataset.date = eldata;
                    if (eldata === datestr) {
                        el.classList.add('dp-day-current');
                    }
                    if (dx.getMonth() !== viewm) {
                        el.classList.add('dp-day-other-month');
                    }
                } else {
                    el.textContent = '-';
                }
                elnew.appendChild(el);
                dx.setDate(d + 1);
            }
            elold.parentNode.replaceChild(elnew, elold);
        });
    }

    function parseDateString(str, format) {
        str = str.trim();
        format = format.replace(/([.*+?^=!:${}()|[\]\/\\])/g, '\\$1');

        var dx = { Y: new Date().getFullYear(), m: 1, d: 1 };

        var replaceTokens = [];
        var re = new RegExp('^' + format.replace(/%(.)/g, function(_, token) {
            if (token in formatter.regex) {
                replaceTokens.push(token);
                return formatter.regex[token];
            } else {
                return token === '%' ? '%' : '';
            }
        }) + '$');
        var match = re.exec(str);
        if (match) {
            for (var i = 1, end = match.length; i < end; i++) {
                var token = replaceTokens[i - 1];
                dx[token] = formatter.toNumber[token](match[i]);
            }
            var d1 = new Date(dx.Y, dx.m - 1, dx.d, 0, 0, 0, 0);
            var d2 = ['' + dx.Y, ('0' + dx.m).slice(-2), ('0' + dx.d).slice(-2)];
            return self.formatDate('%Y%m%d', d1) === d2.join('') ? d1 : null;
        }

        return null;
    }

    function setDate(date) {
        if (date instanceof Date) {
            date = new Date(date);
        } else if (date) {
            date = parseDateString(date, self._cfg.dateFormat);
        } else {
            date = null;
        }
        var viewdate;
        if ((date instanceof Date) && !isNaN(date.getTime())) {
            (self._date = date).setHours(0, 0, 0, 0);
            viewdate = new Date(self._date);
        } else {
            self._date = null;
            (viewdate = new Date()).setHours(0, 0, 0, 0);
        }

        var viewt = viewdate.getTime();
        if (viewt < self._cfg.minDate.getTime()) {
            viewdate = self._cfg.minDate;
        } else if (viewt > self._cfg.maxDate.getTime()) {
            viewdate = self._cfg.maxDate;
        }
        self._viewdate = Fn.dayFirst(viewdate);

        updateCalendar();
    }

    function open(date, position) {
        setDate(date);

        if (position) {
            self._container.style.position = position.position || 'absolute';
            self._container.style.left = position.left || 0;
            self._container.style.top = position.top || 0;
        }

        self._container.classList.remove('dp-close');

        if (self._events.onOpen) {
            self._events.onOpen();
        }
    }

    function close() {
        self._container.classList.add('dp-close');
        self._container.style.position = '';
        self._container.style.left = '';
        self._container.style.top = '';

        if (self._events.onClose) {
            self._events.onClose();
        }
    }

    function destroy() {
        while (self._handlers.length > 0) {
            var hinfo = self._handlers.pop();
            hinfo[0].removeEventListener(hinfo[1], hinfo[2], hinfo[3]);
        }
        (self._cfg.appendTo || document.body).removeChilde(self._container);
        self._container = null;
    }

    init();
    return this;
}

DatePicker.prototype = {
    formatDate: function(format, date) {
        return (format).replace(/%(.)/g, function(match, token) {
            if (token in formatter.format) {
                return formatter.format[token](date);
            } else {
                return token === '%' ? '%' : '';
            }
        });
    }
};

return DatePicker;

}));
