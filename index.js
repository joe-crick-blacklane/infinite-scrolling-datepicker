/*
 * Systemantics infinite scrolling datepicker
 * v0.12.2
 *
 * Copyright (C) 2015–2016 by Systemantics GmbH
 *
 * hello@systemantics.net
 * http://www.systemantics.net/
 *
 * Licensed under the MIT license.
 */

function formatDate(year, month, day) {
  return (
    ('0000' + year).substr(-4) +
    '-' +
    ('00' + month).substr(-2) +
    '-' +
    ('00' + day).substr(-2)
  )
}

function getMonthHeader(year, month, settings) {
  return '<div class="sys-datepicker-month" data-year="' + year + '" data-month="' + month + '">' +
    '<div class="sys-datepicker-month-header">' + settings.monthNames[month - 1] +
    ' ' + year + '</div>'
}

function getDaysPerMonth(month, year) {
  return month === 4 || month === 6 || month === 9 || month === 11
    ? 30
    : month === 2
      ? year & 3 || (!(year % 25) && year & 15) ? 28 : 29
      : 31
}

function buildDayHtml(classes, date, day) {
  return '<div class="' + classes.join(' ') + '" data-date="' + date + '">' +
    day +
    '</div>'
}

function classGenerator(month, year) {
  var date = new Date()
  return function generateDateClasses(thisDate, today, dayOfTheWeek) {
    var classes = ['sys-datepicker-day']
    var currentMonth = date.getMonth() + 1
    var currentYear = date.getFullYear()

    if (thisDate === today && currentMonth == month && currentYear === year) {
      classes.push('sys-datepicker-day-today')
    }
    if(thisDate < today) {
      classes.push('sys-datepicker-day-disabled')
    }
    if (dayOfTheWeek === 0 || dayOfTheWeek === 6) {
      classes.push('sys-datepicker-day-weekend')
    }
    return classes
  }
}

function generateDatePlaceholder() {
  return '<div class="sys-datepicker-placeholder"/>'
}

function paddingDayChecker(firstWeekDayOfTheMonth, daysPerMonth) {
  return function isPaddingDay(calendarCell) {
    return (calendarCell < firstWeekDayOfTheMonth || calendarCell >= (daysPerMonth + firstWeekDayOfTheMonth))
  }
}


(function($) {
  var numYears = 5

  function getMonthHtml(year, month, settings) {
    var monthHtml = getMonthHeader(year, month, settings)
    var firstWeekDayOfTheMonth = new Date(formatDate(year, month, 1)).getUTCDay()
    var calendarCellCount = 34
    var today = getTodayISO()
    var dayOfTheWeek = 0
    var calendarCell = 0
    var day = 0
    var daysPerMonth = getDaysPerMonth(month, year)
    var isPaddingDay = paddingDayChecker(firstWeekDayOfTheMonth, daysPerMonth)
    var generateClasses = classGenerator(month, year)

    while (calendarCell <= calendarCellCount) {
      var thisDate = formatDate(year, month, calendarCell)
      var classes = generateClasses(thisDate, today, dayOfTheWeek)
      var showPaddingDay = isPaddingDay(calendarCell)
      if (dayOfTheWeek === 0) {
        monthHtml += '<div class="sys-datepicker-week">'
      }

      if (showPaddingDay) {
        monthHtml += generateDatePlaceholder()
      } else {
        ++day
        monthHtml += buildDayHtml(classes, thisDate, day)
      }

      if (dayOfTheWeek === 6) {
        monthHtml += '</div>'
      }

      dayOfTheWeek = dayOfTheWeek === 6 && !showPaddingDay ? 0 : ++dayOfTheWeek
      calendarCell++
    }

    monthHtml += '</div></div>'

    return monthHtml
  }

  function getYearHtml(year, settings) {
    var yearHtml = '<div class="sys-datepicker-year" data-year="' + year + '">'

    for (var m = 1; m <= 12; m++) {
      yearHtml = yearHtml + getMonthHtml(year, m, settings)
    }

    yearHtml = yearHtml + '</div>'

    return yearHtml
  }

  function addYear(dp, year, settings) {
    var dpBody = dp.find('.sys-datepicker-body')
    var bottomYear = $('.sys-datepicker-year:eq(-1)').data('year')
    var scrollTop

    if (year > bottomYear) {
      // Append one at the bottom
      dpBody.append(getYearHtml(year, settings))
      // Remove one at the top while maintaining the scroll position
      scrollTop = dpBody.scrollTop()
      dp.find('.sys-datepicker-year:eq(0)').remove()
      dpBody.scrollTop(
        scrollTop - dp.find('.sys-datepicker-year:eq(0)').outerHeight(true)
      )
    } else {
      // Append year at the top while maintaining scroll position
      scrollTop = dpBody.scrollTop()
      dpBody.prepend(getYearHtml(year, settings))
      dpBody.scrollTop(
        scrollTop + dp.find('.sys-datepicker-year:eq(0)').outerHeight(true)
      )
      // Remove one at the bottom
      dp.find('.sys-datepicker-year:eq(-1)').remove()
    }
  }

  function populate(dp, settings) {
    var dpBody = dp.find('.sys-datepicker-body')
    var startYear = parseInt(settings.defaultDate)
    var yearCount = 1
    var additionalYear = 0

    // Add years
    for(additionalYear; additionalYear < yearCount; additionalYear++) {
      dpBody.append(getYearHtml(startYear + additionalYear, settings))
    }
  }

  function gotoYearMonth(dp, year, month, settings) {
    var dpBody = dp.find('.sys-datepicker-body')
    var selector = '.sys-datepicker-month[data-year="' + year + '"]'

    if (month >= 1 && month <= 12) {
      selector = selector + '[data-month="' + month + '"]'
    }

    var monthEl = dp.find(selector)
    if (monthEl.length === 0) {
      // Append year
      addYear(dp, year, settings)
      monthEl = dp.find(selector)
    }

    // Remove all other years
    dp.find('.sys-datepicker-year:not([data-year="' + year + '"])').remove()

    // add extra years
    var x
    for (x = year + 1; x <= year + (numYears - 1) / 2; x++) {
      dpBody.append(getYearHtml(x, settings))
    }

    // Scroll to that year and month
    dpBody.scrollTop(dpBody.scrollTop() + monthEl.position().top)
  }

  function getCurrent(dp) {
    var current = {}

    dp.find('.sys-datepicker-month').each(function() {
      var monthEl = $(this)

      if (monthEl.position().top + monthEl.outerHeight(true) / 2 > 0) {
        current = {
          year: monthEl.data('year'),
          month: monthEl.data('month')
        }
        return false
      }
    })

    return current
  }

  function getTodayISO() {
    var today = new Date()

    return formatDate(
      today.getFullYear(),
      today.getMonth() + 1,
      today.getDate()
    )
  }

  function isValidISODate(date) {
    return date.match(/^\d{4}-\d{2}-\d{2}/) === true
  }

  var runOptions = function(context) {
    return {
      show: function() {
        context.trigger('show.sys-datepicker')
      },
      hide: function() {
        context.trigger('hide.sys-datepicker')
      },
      addDates: function(value) {
        context.trigger('addDates.sys-datepicker', [value])
      },
      removeDates: function(value) {
        context.trigger('removeDates.sys-datepicker', [value])
      }
    }
  }

  function getDefaultSettings() {
    return {
      onSelect: null,
      defaultDate: getTodayISO(),
      monthNames: [
        'January',
        'February',
        'March',
        'April',
        'May',
        'June',
        'July',
        'August',
        'September',
        'October',
        'November',
        'December'
      ],
      dayNamesMin: ['S', 'M', 'T', 'W', 'T', 'F', 'S'],
      firstDay: 0,
      prevYearText: '&lt;&lt;',
      prevText: '&lt;',
      currentText: 'Date',
      nextText: '&gt;',
      nextYearText: '&gt;&gt;',
      convertISOToDisplayDate: false,
      convertDisplayDateToISO: false
    }
  }

  $.fn.datepicker = function(options, value) {
    var context, actions, settings

    if (typeof options === 'string' && options !== '') {
      context = this
      actions = runOptions(context)
      actions[options](value)
    } else {
      settings = $.extend(
        getDefaultSettings(),
        options
      )

      this.each(function() {
        var element = $(this)

        if (element.hasClass('sys-datepicker-attached')) {
          // Don’t init twice
          return
        }

        element.addClass('sys-datepicker-attached')

        if (!isValidISODate(settings.defaultDate)) {
          settings.defaultDate = getTodayISO()
        }

        var dp = $('<div class="sys-datepicker" style="display:none"/>').appendTo('body'),
          dpContent = $('<div class="sys-datepicker-content"/>').appendTo(dp),
          dpHeader = $(
            '<div class="sys-datepicker-header">' +
            '<div class="sys-datepicker-button sys-datepicker-button-today"><div class="sys-datepicker-title">' +
            settings.currentText +
            '</div><div><button class="sys-datepicker-close-button">X</button></div></div>' +
            '</div>'
          ).appendTo(dpContent),
          dpBody = $('<div class="sys-datepicker-body"/>').appendTo(dpContent),
          selectedDates = [],
          inputDate = ''

        var dpDayHeaders = $('<div class="sys-datepicker-days"/>').appendTo(
          dpHeader
        )
        for (var i = settings.firstDay; i <= settings.firstDay + 6; i++) {
          var dayHeaderHtml = '<div class="sys-datepicker-days-dow',
            dow = i % 7
          if (dow === 0 || dow === 6) {
            dayHeaderHtml = dayHeaderHtml + ' sys-datepicker-day-weekend'
          }
          $(
            dayHeaderHtml +
            '">' +
            (decodeURIComponent(escape(settings.dayNamesMin[dow])) + '</div>')
          ).appendTo(dpDayHeaders)
        }

        populate(dp, settings)
        dp.show()
        gotoYearMonth(
          dp,
          parseInt(settings.defaultDate),
          parseInt(settings.defaultDate.substr(5, 2)),
          settings
        )
        dp.hide()

        var prevScrollTop = dpBody.scrollTop()

        dpBody.on('scroll', function() {
          var scrollTop = dpBody.scrollTop()

          if (scrollTop > prevScrollTop) {
            direction = 1
          } else if (scrollTop < prevScrollTop) {
            direction = -1
          } else {
            direction = 0
          }
          prevScrollTop = scrollTop

          var current = getCurrent(dp)
          if (typeof current !== 'undefined') {
            var topYear = dpBody
                .find('.sys-datepicker-year:eq(0)')
                .data('year'),
              bottomYear = dpBody
                .find('.sys-datepicker-year:eq(-1)')
                .data('year')

            if (current.year === bottomYear) {
              addYear(dp, bottomYear + 1, settings)
            }
          }
        })

        var prevVal = null
        element.on('keyup change', function() {
          var val = $(this).val(),
            comp,
            year,
            month

          if ($.isFunction(settings.convertDisplayDateToISO)) {
            val = settings.convertDisplayDateToISO(val)
            if (typeof val !== 'string' && !(val instanceof String)) {
              return
            }
          }

          comp = val.trim().match(/^(\d{4})(-((\d{2})(-(\d{2})?)?)?)?$/)

          if (!!comp && !!comp[1]) {
            year = parseInt(comp[1])
            month = !!comp[3]
              ? Math.max(1, Math.min(12, parseInt(comp[3])))
              : 1
            gotoYearMonth(dp, year, month, settings)
            setInputDate(val.trim())
          }
        })

        dp.on(
          'mouseenter',
          '.sys-datepicker-day,.sys-datepicker-button',
          function() {
            $(this).addClass('sys-datepicker-hover')
          }
        )
        dp.on(
          'mouseleave',
          '.sys-datepicker-day,.sys-datepicker-button',
          function() {
            $(this).removeClass('sys-datepicker-hover')
          }
        )

        dp.on('click', '.sys-datepicker-day', function() {
          var date = $(this).data('date')

          if ($.isFunction(settings.convertISOToDisplayDate)) {
            date = settings.convertISOToDisplayDate(date)
          }

          // Set value
          element.val(date)
          element.focus()

          // Callback
          if ($.isFunction(settings.onSelect)) {
            settings.onSelect.call(element.eq(0), date)
          }
        })

        // dp.on("click", ".sys-datepicker-button-prevmonth", function() {
        //   var current = getCurrent(dp);
        //
        //   current.month = current.month - 1;
        //   if (current.month === 0) {
        //     current.year = current.year - 1;
        //     current.month = 12;
        //   }
        //   gotoYearMonth(dp, current.year, current.month, settings);
        // });

        // dp.on("click", ".sys-datepicker-button-nextmonth", function() {
        //   var current = getCurrent(dp);
        //
        //   current.month = current.month + 1;
        //   if (current.month === 13) {
        //     current.year = current.year + 1;
        //     current.month = 1;
        //   }
        //   gotoYearMonth(dp, current.year, current.month, settings);
        //   el.focus();
        // });
        //
        // dp.on("click", ".sys-datepicker-button-prevyear", function() {
        //   var current = getCurrent(dp);
        //
        //   gotoYearMonth(dp, current.year - 1, current.month, settings);
        //   el.focus();
        // });
        //
        // dp.on("click", ".sys-datepicker-button-nextyear", function() {
        //   var current = getCurrent(dp);
        //
        //   gotoYearMonth(dp, current.year + 1, current.month, settings);
        //   el.focus();
        // });

        // dp.on("click", ".sys-datepicker-button-today", function() {
        //   var today = new Date();
        //
        //   gotoYearMonth(
        //     dp,
        //     today.getFullYear(),
        //     today.getMonth() + 1,
        //     settings
        //   );
        //   el.focus();
        // });

        element.on('focus click show.sys-datepicker', function() {
          var p = element.offset()

          setInputDate(element.val().trim())

          dp.css({
            position: 'absolute',
            left: p.left,
            top: p.top + element.outerHeight()
          })
          dp.show()
        })

        element.on('keydown', function(e) {
          if (e.keyCode === 9 || e.keyCode === 27) {
            // Hide on tab out and Esc
            dp.hide()
          }
        })

        $(document).on('click', function(e) {
          if (
            $(e.target)
              .closest('.sys-datepicker')
              .get(0) !== dp.get(0) &&
            $(e.target)
              .closest('.sys-datepicker-attached')
              .get(0) !== element.get(0)
          ) {
            dp.hide()
          }
        })

        element.on('hide.sys-datepicker', function() {
          dp.hide()
        })

        function addDate(date) {
          for (var i in selectedDates) {
            if (selectedDates[i] === date) {
              return
            }
          }
          selectedDates.push(date)

          dp
            .find('.sys-datepicker-day[data-date="' + date + '"]')
            .addClass('sys-datepicker-day-selected')
        }

        function removeDate(date) {
          var dates = []

          for (var i in selectedDates) {
            if (selectedDates[i] !== date) {
              dates.push(selectedDates[i])
            }
          }
          selectedDates = dates

          dp
            .find('.sys-datepicker-day[data-date="' + date + '"]')
            .removeClass('sys-datepicker-day-selected')
        }

        function setInputDate(date) {
          dp
            .find('.sys-datepicker-day[data-date="' + inputDate + '"]')
            .removeClass('sys-datepicker-day-input')
          var isSelected = false
          for (var i in selectedDates) {
            if (selectedDates[i] === inputDate) {
              isSelected = true
              break
            }
          }
          if (!isSelected) {
            dp
              .find('.sys-datepicker-day[data-date="' + inputDate + '"]')
              .removeClass('sys-datepicker-day-selected')
          }

          inputDate = date
          dp
            .find('.sys-datepicker-day[data-date="' + inputDate + '"]')
            .addClass('sys-datepicker-day-selected sys-datepicker-day-input')
        }

        element.on('addDates.sys-datepicker', function(e, dates) {
          if (Object.prototype.toString.call(dates) === '[object Array]') {
            for (var i in dates) {
              addDate(dates[i])
            }
          } else {
            addDate(dates)
          }
        })

        element.on('removeDates.sys-datepicker', function(e, dates) {
          if (Object.prototype.toString.call(dates) === '[object Array]') {
            for (var i in dates) {
              removeDate(dates[i])
            }
          } else {
            removeDate(dates)
          }
        })
      })
    }

    return this
  }

})(jQuery)
