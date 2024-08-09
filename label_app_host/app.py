from flask import Flask, request, jsonify, render_template
from pymongo import MongoClient
from bson import ObjectId
import random
import os

app = Flask(__name__)

mongo_uri = 'mongo uri'
client = MongoClient(mongo_uri)
db = client['labelDB']
unlabeled_collection = db['unlabeled_data']
labeled_collection = db['labeled_data']

@app.route('/')
def index():
    return render_template('index.html')

@app.route('/get_data', methods=['GET'])
def get_data():
    total_count = unlabeled_collection.count_documents({})
    if total_count <= 5:
        skip = 0
    else:
        skip = random.randint(0, total_count - 5)
    
    data = list(unlabeled_collection.find({}, {'sentence': 1}).skip(skip).limit(5))
    return jsonify([{'_id': str(item['_id']), 'sentence': item['sentence']} for item in data])

@app.route('/save_all', methods=['POST'])
def save_all_labels():
    data = request.json
    
    with client.start_session() as session:
        with session.start_transaction():
            labeled_docs = []
            ids_to_remove = []
            
            for labeled_data in data:
                sentence = labeled_data.get('sentence', '')
                results = labeled_data.get('results', [])
                
                doc = {
                    "sentence": sentence,
                    "results": results
                }
                labeled_docs.append(doc)
                
                original_doc = unlabeled_collection.find_one({'sentence': sentence}, session=session)
                if original_doc:
                    ids_to_remove.append(original_doc['_id'])
            
            if labeled_docs:
                labeled_collection.insert_many(labeled_docs, session=session)
            if ids_to_remove:
                unlabeled_collection.delete_many({'_id': {'$in': ids_to_remove}}, session=session)
    
    return jsonify({'status': 'success'}), 200

if __name__ == '__main__':
    app.run(debug=True)