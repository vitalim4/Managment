angular.module('globalSettings', [])
    .factory('globalSettings', function () {
        var settings = {};


        settings.tableTranslation = {
            "sEmptyTable": "לא קיימות רשומות להצגה",
            "sInfo": "מציג רשומות מ _START_ עד _END_ מתוך _TOTAL_ סהכ",
            "sInfoEmpty": "מציג 0 0 מתוך 0 רשומות",
            "sInfoFiltered": "(סינון מ _MAX_ סהכ entries)",
            "sInfoPostFix": "",
            "sInfoThousands": ",",
            "sLengthMenu": "הצג _MENU_ שורות",
            "sLoadingRecords": "טוען...",
            "sProcessing": "מעבד...",
            "sSearch": " חיפוש:",
            "sZeroRecords": "לא נמצאו רשומות",
            "oPaginate": {"sFirst": "ראשון", "sLast": "אחרון", "sNext": "הבא", "sPrevious": "הקודם"},
            "oAria": {"sSortAscending": ": מיין בסדר עולה", "sSortDescending": "מיין בסדר יורד"}
        };

        return settings;

    });
