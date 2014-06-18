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

def addTransition(data):
    try:
        client.local.transitions.insert(json.loads(data))
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

def pollStream(userid):
    if userStreams.get(userid, None) == None:
        raise StopIteration
    else:
        temp = userStreams[userid].next()
        yield json.loads(temp)

def run(operation="start", **kwargs):
    if not validConnection:
        return "NO DB CONNECTION"
    
    if operation == "start":
        return start(**kwargs)
    elif operation == "resume":
        return resume(**kwargs)
    elif operation == "addMouseData":
        return addMouseData(**kwargs)
    elif operation == "countStream":
        return countStream(**kwargs)
    elif operation == "pollStream":
        return pollStream(**kwargs)