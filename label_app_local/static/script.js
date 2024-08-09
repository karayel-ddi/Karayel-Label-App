$(document).ready(function () {
    var csvData = [];
    var currentPage = 1;
    var rowsPerPage = 5;
    var totalPages = 1;
    var labeledData = [];
    var localLabeledData = [];

    function handleFileSelect(evt) {
        var file = evt.target.files[0];
        var reader = new FileReader();
        reader.onload = function (e) {
            processData(e.target.result);
        };
        reader.readAsText(file);
    }

    function handleDragOver(evt) {
        evt.stopPropagation();
        evt.preventDefault();
        evt.dataTransfer.dropEffect = 'copy';
    }

    function handleFileDrop(evt) {
        evt.stopPropagation();
        evt.preventDefault();
        var files = evt.dataTransfer.files;
        var reader = new FileReader();
        reader.onload = function (e) {
            processData(e.target.result);
        };
        reader.readAsText(files[0]);
    }

    function processData(csv) {
        csvData = $.csv.toArrays(csv);
        var headers = csvData[0];
        var select = $('#columnSelect');
        select.empty();
        headers.forEach(function (header, index) {
            select.append($('<option></option>').attr('value', index).text(header));
        });
        $('#columnSelectionArea').show();

        if (headers.length > 0) {
            select.val(0);
            displayData(0);
        }
    }

    $('#columnSelect').change(function () {
        var selectedColumn = $(this).val();
        displayData(selectedColumn);
    });

    function displayData(column) {
        var tableBody = $('#dataTable tbody');
        tableBody.empty();
        var startIndex = (currentPage - 1) * rowsPerPage + 1;
        var endIndex = Math.min(startIndex + rowsPerPage, csvData.length);

        for (var i = startIndex; i < endIndex; i++) {
            if (csvData[i] && csvData[i][column] !== undefined) {
                var row = $('<tr></tr>');
                row.append($('<td></td>').text(csvData[i][column]));
                row.append($('<td></td>').html('<button class="btn btn-sm btn-primary select-data">Seç</button>'));
                tableBody.append(row);
            }
        }

        totalPages = Math.ceil((csvData.length - 1) / rowsPerPage);
        updatePagination();
        $('#dataTableArea').show();
        $('#labelingArea').show();
    }

    function updatePagination() {
        var pagination = $('#pagination');
        pagination.empty();

        if (totalPages <= 1) return;

        var startPage = Math.max(1, currentPage - 2);
        var endPage = Math.min(totalPages, currentPage + 2);

        if (currentPage > 1) {
            pagination.append('<li class="page-item"><a class="page-link" href="#" data-page="' + (currentPage - 1) + '">Önceki</a></li>');
        }

        if (startPage > 1) {
            pagination.append('<li class="page-item"><a class="page-link" href="#" data-page="1">1</a></li>');
            if (startPage > 2) {
                pagination.append('<li class="page-item disabled"><span class="page-link">...</span></li>');
            }
        }

        for (var i = startPage; i <= endPage; i++) {
            var li = $('<li class="page-item"><a class="page-link" href="#" data-page="' + i + '">' + i + '</a></li>');
            if (i === currentPage) {
                li.addClass('active');
            }
            pagination.append(li);
        }

        if (endPage < totalPages) {
            if (endPage < totalPages - 1) {
                pagination.append('<li class="page-item disabled"><span class="page-link">...</span></li>');
            }
            pagination.append('<li class="page-item"><a class="page-link" href="#" data-page="' + totalPages + '">' + totalPages + '</a></li>');
        }

        if (currentPage < totalPages) {
            pagination.append('<li class="page-item"><a class="page-link" href="#" data-page="' + (currentPage + 1) + '">Sonraki</a></li>');
        }
    }

    $('#pagination').on('click', 'a', function (e) {
        e.preventDefault();
        currentPage = parseInt($(this).data('page'));
        displayData($('#columnSelect').val());
    });

    $('#dataTable').on('click', '.select-data', function () {
        var text = $(this).closest('tr').find('td:first').text();
        $('#labelArea').text(text);
    });
    $('#csvFileInput').on('change', function () {
        var fileInput = $(this)[0];

        if (fileInput.files.length > 0) {
            $('#dropZone').hide();
        }
    });
    function getSelectedText() {
        var text = "";
        if (window.getSelection) {
            text = window.getSelection().toString();
        } else if (document.selection && document.selection.type != "Control") {
            text = document.selection.createRange().text;
        }
        return text.trim();
    }

    function wrapSelectedText(text, sentiment, color) {
        if (!text) {
            alert("Lütfen etiketlemek için bir metin seçin.");
            return;
        }

        var labelArea = $('#labelArea');
        var html = labelArea.html();
        var escapedText = $('<div>').text(text).html();
        var regex = new RegExp('([^<]*)(' + escapedText + ')([^>]*)', 'g');

        var labeledText = html.replace(regex, function (match, before, selectedText, after) {
            if (before.indexOf('<span') === -1 && after.indexOf('</span>') === -1) {
                return before + '<span class="labeled" data-sentiment="' + sentiment + '" style="background-color:' + color + ';">' + selectedText + '</span>' + after;
            } else {
                return match;
            }
        });

        labelArea.html(labeledText);

        labeledData = labeledData.filter(function (item) {
            return item.entity !== text;
        });
        labeledData.push({ entity: text, sentiment: sentiment });
    }

    $('#labelButtons').on('click', '.label-button', function () {
        var sentiment = $(this).data('sentiment');
        var color = $(this).css('background-color');
        var selectedText = getSelectedText();
        if (selectedText) {
            wrapSelectedText(selectedText, sentiment, color);
        }
    });

    $('#labelArea').on('click', '.labeled', function () {
        var text = $(this).text();
        labeledData = labeledData.filter(function (item) {
            return item.entity !== text;
        });
        $(this).replaceWith($(this).text());
    });

    $('#submitButton').click(function () {
        var sentence = $('#labelArea').text();

        localLabeledData.push({
            sentence: sentence,
            results: labeledData
        });

        alert('Veri başarıyla kaydedildi.');
        labeledData = [];
        $('#labelArea').empty();
    });

    $('#sendAllButton').click(function () {
        var dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(localLabeledData));
        var downloadAnchorNode = document.createElement('a');
        downloadAnchorNode.setAttribute("href", dataStr);
        downloadAnchorNode.setAttribute("download", "labeled_data.json");
        document.body.appendChild(downloadAnchorNode);
        downloadAnchorNode.click();
        downloadAnchorNode.remove();

        alert('Tüm veriler başarıyla indirildi.');
        localLabeledData = [];
    });

    $('#addLabelButton').click(function () {
        $('#labelModal').modal('toggle');
    });

    $('#saveLabelButton').click(function () {
        var labelName = $('#labelName').val();
        var labelSentiment = $('#labelName').val();
        var labelColor = $('#labelColor').val();

        if (labelName && labelSentiment && labelColor) {
            var newButton = $('<button>')
                .addClass('btn mr-2 label-button')
                .attr('data-sentiment', labelSentiment)
                .css('background-color', labelColor)
                .text(labelName);

            $('#labelButtons').append(newButton);
            $('#labelModal').modal('hide');
            $('#labelForm')[0].reset();
        } else {
            alert("Lütfen tüm alanları doldurun.");
        }
    });

    document.getElementById('csvFileInput').addEventListener('change', handleFileSelect, false);
    var dropZone = document.getElementById('dropZone');
    dropZone.addEventListener('dragover', handleDragOver, false);
    dropZone.addEventListener('drop', handleFileDrop, false);

    var defaultLabels = [
        { name: "Pozitif", sentiment: "positive", color: "#91fa97" },
        { name: "Nötr", sentiment: "neutral", color: "#f7fa91" },
        { name: "Negatif", sentiment: "negative", color: "#f76868" }
    ];

    defaultLabels.forEach(function (label) {
        var button = $('<button>')
            .addClass('btn mr-2 label-button')
            .attr('data-sentiment', label.sentiment)
            .css('background-color', label.color)
            .text(label.name);
        $('#labelButtons').append(button);
    });
});
