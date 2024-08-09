$(document).ready(function () {
    var labeledData = [];
    var currentData = [];

    function fetchData() {
        $.get('/get_data', function (data) {
            currentData = data;
            populateTable(data);
            $('#dataTableArea').show();
        });
    }

    function populateTable(data) {
        const tableBody = $('#dataTable tbody');
        tableBody.empty();
        data.forEach((item, index) => {
            const row = `<tr data-id="${item._id}" data-index="${index}">
                <td>${item.sentence}</td>
                <td>
                    <button class="btn btn-primary selectButton">Seç</button>
                    <button class="btn btn-success viewLabelsButton" style="display:none;">✓</button>
                </td>
            </tr>`;
            tableBody.append(row);
        });
    }

    $('#dataTable').on('click', '.selectButton', function () {
        const row = $(this).closest('tr');
        const index = row.data('index');
        loadLabelingData(index);
    });

    $('#dataTable').on('click', '.viewLabelsButton', function () {
        const row = $(this).closest('tr');
        const index = row.data('index');
        const item = labeledData.find(data => data.sentence === currentData[index].sentence);
        if (item) {
            showLabelsModal(item);
        }
    });

    function showLabelsModal(item) {
        $('#labelsModalBody').text(JSON.stringify(item.results, null, 2));
        $('#labelsModal').modal('show');
    }

    function loadLabelingData(index) {
        const item = currentData[index];
        $('#labelArea').empty();
        $('#labelingArea').show();
        $('#saveButton').data('id', item._id);

        let existingData = labeledData.find(data => data.sentence === item.sentence);
        if (existingData) {
            displayLabeledSentence(item.sentence, existingData.results);
        } else {
            $('#labelArea').text(item.sentence);
        }
    }

    function displayLabeledSentence(sentence, results) {
        let html = sentence;
        results.forEach(item => {
            const color = getColorForSentiment(item.sentiment);
            html = html.replace(item.entity, `<span class="labeled" data-sentiment="${item.sentiment}" style="background-color:${color};">${item.entity}</span>`);
        });
        $('#labelArea').html(html);
    }

    function addLabel(text, sentiment) {
        const currentSentence = $('#labelArea').text();
        let sentenceData = labeledData.find(data => data.sentence === currentSentence);

        if (!sentenceData) {
            sentenceData = { sentence: currentSentence, results: [] };
            labeledData.push(sentenceData);
        }

        sentenceData.results = sentenceData.results.filter(item => item.entity !== text);
        sentenceData.results.push({ entity: text, sentiment: sentiment });

        updateLabelDisplay(sentenceData.results);
    }

    function updateLabelDisplay(results) {
        const labelArea = $('#labelArea');
        let html = labelArea.text();
        results.forEach(item => {
            const color = getColorForSentiment(item.sentiment);
            html = html.replace(item.entity, `<span class="labeled" data-sentiment="${item.sentiment}" style="background-color:${color};">${item.entity}</span>`);
        });
        labelArea.html(html);
    }

    function getColorForSentiment(sentiment) {
        switch (sentiment) {
            case 'positive': return '#91fa97';
            case 'neutral': return '#f7fa91';
            case 'negative': return '#f76868';
            default: return '#cccccc';
        }
    }

    $('#labelButtons').on('click', '.label-button', function () {
        var sentiment = $(this).data('sentiment');
        var selectedText = window.getSelection().toString().trim();
        if (selectedText) {
            addLabel(selectedText, sentiment);
        }
    });

    $('#labelArea').on('click', '.labeled', function () {
        var text = $(this).text();
        const currentSentence = $('#labelArea').text();
        let sentenceData = labeledData.find(data => data.sentence === currentSentence);
        if (sentenceData) {
            sentenceData.results = sentenceData.results.filter(item => item.entity !== text);
            updateLabelDisplay(sentenceData.results);
        }
    });

    $('#saveButton').click(function () {
        const id = $(this).data('id');
        const sentence = $('#labelArea').text();
        let sentenceData = labeledData.find(data => data.sentence === sentence);
        if (sentenceData) {
            sentenceData.id = id;
            $(`tr[data-id="${id}"]`).addClass('table-success');
        }
        $('#labelingArea').hide();
    });

    $('#sendAllButton').click(function () {
        if (labeledData.length !== 5) {
            alert('Lütfen tüm 5 veriyi de etiketleyin.');
            return;
        }

        $.ajax({
            url: '/save_all',
            type: 'POST',
            contentType: 'application/json',
            data: JSON.stringify(labeledData),
            success: function () {
                alert('Tüm etiketlenmiş veriler başarıyla kaydedildi.');
                labeledData = [];
                fetchData();
            },
            error: function () {
                alert('Veriler kaydedilirken bir hata oluştu.');
            }
        });
    });


    $('#saveLabelButton').click(function () {
        var labelName = $('#labelName').val();
        var labelColor = $('#labelColor').val();

        if (labelName && labelColor) {
            var newButton = $('<button>')
                .addClass('btn mr-2 label-button')
                .attr('data-sentiment', labelName.toLowerCase())
                .css('background-color', labelColor)
                .text(labelName);

            $('#labelButtons').append(newButton);
            $('#labelModal').modal('hide');
            $('#labelForm')[0].reset();
        } else {
            alert("Lütfen tüm alanları doldurun.");
        }
    });

    fetchData();

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
