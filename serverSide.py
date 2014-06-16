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
        client.local.results.insert(json.loads(history))
        return "SUCCESS"
    except:
        return "COULDN'T ADD DATA"

def countMouseData(currentSlide):
    query = {}
    try:
        return client.local.results.find(query).count()
    except:
        return "COULDN'T COUNT DATA"

def startStream(userid, currentSlide):
    query = {"s":currentSlide}
    try:
        userStreams[userid] = client.local.results.find(query)
        return userStreams[userid].count()
    except:
        return "COULDN'T GET DATA"

def pollStream(userid):
    if userStreams.get(userid, None) == None:
        raise StopIteration
    else:
        yield json.loads(userStreams[userid].next())

def run(operation="start", **kwargs):
    if not validConnection:
        return "NO DB CONNECTION"
    
    if operation == "start":
        return start(**kwargs)
    elif operation == "resume":
        return resume(**kwargs)
    elif operation == "addMouseData":
        return addMouseData(**kwargs)
    elif operation == "startStream":
        return startStream(**kwargs)
    elif operation == "countMouseData":
        return countMouseData(**kwargs)
    elif operation == "pollStream":
        return pollStream(**kwargs)