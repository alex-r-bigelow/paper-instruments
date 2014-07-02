# -*- coding: utf-8 -*-
"""
Created on Mon Jun  9 08:13:14 2014

@author: Alex Bigelow
"""

import pymongo, json
from bson.objectid import ObjectId

validConnection = True
userStreams = {}
try:
    client = pymongo.MongoClient('localhost', 27017)
except:
    validConnection = False

def start():
    try:
        newId = str(client.local.participants.insert({"s":None}))
        userStreams[newId] = None
        return newId
    except:
        return "CAN'T CREATE ID"

def resume(userid):
    query = {"_id":ObjectId(userid)}
    try:
        doc = client.local.participants.find_one(query)
        userStreams[userid] = None
    except:
        return "DB ERROR"
    if doc == None:
        return "ID DOESN'T EXIST"
    elif doc["s"] == None:
        return "NO HISTORY"
    else:
        return doc["s"]

def addMouseData(history):
    try:
        # history is actually an array, but insert will still digest it properly
        client.local.tracking.insert(json.loads(history))
        return "SUCCESS"
    except:
        return "COULDN'T ADD DATA"

def addTransition(motion):
    try:
        client.local.transitions.insert(json.loads(motion))
        return "SUCCESS"
    except:
        return "COULDN'T ADD DATA"

def countStream(userid, currentSlide):
    query = {"s":currentSlide}
    try:
        userStreams[userid] = client.local.tracking.find(query)
        return userStreams[userid].count()
    except:
        return "COULDN'T GET DATA"

def stream(userid):
    # return userStreams.get(userid, None)
    if userStreams.get(userid, None) == None:
        return
    else:
        try:
            while True:
                temp = userStreams[userid].next()
                temp['_id'] = str(temp['_id'])
                yield json.dumps(temp)
        except StopIteration:
            pass

def reset_db():
    client.local.participants.drop()
    client.local.tracking.drop()
    client.local.transitions.drop()
    
    client.local.create_collection('participants')
    client.local.create_collection('tracking')
    client.local.create_collection('transitions')

def run(operation="start", **kwargs):
    if not validConnection:
        return "NO DB CONNECTION"
    
    if operation == "start":
        return start(**kwargs)
    elif operation == "resume":
        return resume(**kwargs)
    elif operation == "addMouseData":
        return addMouseData(**kwargs)
    elif operation == "addTransition":
        return addTransition(**kwargs)
    elif operation == "countStream":
        return countStream(**kwargs)

if __name__ == '__main__':
    reset_db()