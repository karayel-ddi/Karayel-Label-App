from flask import Flask, request, jsonify, render_template
from pymongo import MongoClient

app = Flask(__name__)

# MongoDB bağlantısı ve veritabanı tanımlamaları:
# client = MongoClient('localhost', 27017)
# db = client['labelDB']
# collection = db['labels']

@app.route('/')
def index():
    return render_template('index.html')

@app.route('/save_all', methods=['POST'])
def save_all_labels():
    data = request.json

    # inserted_ids = []
    # for labeled_data in data:
    #     sentence = labeled_data.get('sentence', '')
    #     results = labeled_data.get('results', [])
    #     entity_list = [item['entity'] for item in results]

    #     document = {
    #         "sentence": sentence,
    #         "entity_list": entity_list,
    #         "results": results
    #     }

    #     inserted_id = collection.insert_one(document).inserted_id
    #     inserted_ids.append(str(inserted_id))

    # MongoDB isteğe bağlı
    # return jsonify({'status': 'success', 'inserted_ids': inserted_ids}), 200
    return jsonify({'status': 'success'}), 200

if __name__ == '__main__':
    app.run(debug=True)
