---
layout: post
title: "Analysis of Tensorflow Contrib Sunset"
description: "Recently tensorflow announced that for 2.0 release, contrib package will cease to exist. The post is aimed at analyzing the after effects."
author: kingspp
category: Algo
tags: tensorflow tensorflow-contrib deeplearning machine-learning
finished: false
---
**What is Tensorflow?**<br>
Tensorflow is the first ever open source project to have > 100,000 stars (for a machine learning framework ;). It is a
full stack framework which includes support data preprocessing, predictive modelling and serving.

**What is tensorflow.contrib package?**<br>
From the time when tensorflow was made opensource, the framework got a lot of attention from the community for its simplicity 
and ease of training a neural network. Contrib package provides rapid prototyping facilities for 
contributors.

**Why is it deprecated?**<br>
Since its inception, contrib package has outgrown its size and use cases, hence from 2.0, contrib package will cease to exist.
Instead, the package will be split into easily maintainable open source projects. Some of the most used
api's will be optimized and later integrated with tensorflow. 

**Is there any way to analyze / measure the after effects?**<br>
It got me thinking, since I was using few api's from contrib package, what might be the global trend? 
The package is not new and is the most contributed amongst others. My intuition for global trend is `tf.contrib.layers.xavier_initializer` api would top, 
just because I am a big fan of it :D.

The obvious place to look for api usage is in *open source projects* which leads to **Github**. Github provides various types of search api's
which aids us in finding the usage statistics. But the implementation is not straightforward as they have disabled code search on their entire
collection of open source projects. Instead they allow us to perform code search on a single repository.

Before heading to github api's I would recommend to setup [OAuth Client Key](https://developer.github.com/v3/#authentication), as the authentication provides,
extra 20 requests / min. By default [rate is limited](https://developer.github.com/v3/search/#rate-limit) to just 10 requests / min. I will be using
[ratelimit](https://github.com/tomasbasham/ratelimit) package to reduce headaches related to rate-limiting! Thanks Tomas!

So the first step is to get a list of all the repositories which uses tensorflow. The easiest way to search a repository 
having tensorflow code is by using filters. <br>
a. Create a list of topics, where projects might use tensorflow framework<br>
b. Primary language of the repository is Python.<br>
c. Repo has > 10 stars. 

<br>
For simplicity sake, lets use a [nosql database (Mongo)](https://www.bogotobogo.com/python/MongoDB_PyMongo/python_MongoDB_pyMongo_tutorial_installing.php) so that it avoids reading / writing json files to the filesystem.



```python
# Create a list of topics related to Artificial Intelligence

topics = ['neural-nets', 'tensorflow', 'machine-learning', 'neural-networks', 'deeplearning', 'deep-learning',
          'tensorflow-contrib', 'distributed_training', 'artificial-intelligence', 'ai', 'tf']

# Now that we have topics lets create a github query
# Github allows to search one topic at a time, so lets have topic as a parameter. Modify respective access token
API_BASE = 'https://api.github.com/search/repositories?q=topic:{}+language:python+stars:>=10&page={}&per_page=100&access_token='

# Reduce rate-limit headaches
import requests
from ratelimit import limits, sleep_and_retry
@sleep_and_retry
@limits(calls=29, period=60)
def query(url):
    return requests.get(url)    

# Search for topics

from pymongo import MongoClient
client = MongoClient()

db = client.tf_sunset
repos = db.repos

for topic in topics:    
    page_counter = 0
    rd = query(API_BASE.format(topic, page_counter)).json()
    while 'incomplete_results' in rd and not rd['incomplete_results']:        
        for item in rd['items']:
            item['topic'] = topic
            repos.insert_one(item)
        print('Working on {} : {}'.format(topic, page_counter))
        page_counter += 1
        rd = query(API_BASE.format(topic, page_counter)).json()
```

[Repo Dataset](https://github.com/kingspp/tf-contrib-analyzer/raw/master/data/repos.zip)

Now that we have a list  ( `db.repos.count()` ) of repositories related to / using tensorflow framework, our
next objective is to find api's related to contrib package in these repositories. To do that, we will use Github's *code search* api.
Github *code search* api returns file url instead of content. To get the content of the file, we just have to query the given git url which
then provides content of the file encoded in *base64* format.

```python

# Github Code Search API - We will look for tf.contrib alternatively also look for tensorflow.contrib (for import usage)
API_BASE = 'https://api.github.com/search/code?q=tf.contrib+language:python+repo:{}&per_page=100&access_token='

total_repos = repos.count()
queries = db.queries

for f_no, repo in enumerate(db.repos.find()):
    req = query(API_BASE.format(repo['full_name'])).json()
    if 'total_count' in req and req['total_count'] == 0 or 'items' not in req:
        continue
    for e, item in enumerate(req['items']):
        # Query for content using given git url
        content = query(item['git_url'] + '?&access_token=').json()
        req['items'][e]['content'] = content
        req['items'][e]['query'] = 'tf.contrib'
    queries.insert_many(req['items'])
    print('Saving: {}. {} / {} '.format(repo['full_name'], f_no, total_repos))
```  

[Code Queries Dataset - tf.contrib](https://github.com/kingspp/tf-contrib-analyzer/raw/master/data/query/tf.contrib.zip)<br>
[Code Queries Dataset - tensorflow.contrib](https://github.com/kingspp/tf-contrib-analyzer/raw/master/data/query/tensorflow.contrib.zip)<br>

We have two collections,<br>
**Repos** - Collection of repos and their statistics <br>
**Queries** - Collection of code search queries and their statistics<br>

Now comes the fun part *REGEX*!. We need to use Regex to find the api usage in the content query. Its simple, head over to 
[regex101](https://regex101.com/), plug in the sample content and come up with expressions. 

Test Input:
```text
import tensorflow as tf\n\
# xyz = tf.contrib.layers.xavier()\n\
 xyz = tf.contrib.layers.xavier()\n\
import tensorflow.contrib\
from tensorflow import contrib\n\
```

Regular Expressions: (Below can be improved and in this exercise I will use normal_usage and commented_usage. However there is a scope for inspecting import level usage)
```python
import re

normal_usage = re.compile('tf\.contrib\.[^\(|^\s]*')
commented_usage = re.compile('#.*(tf\.contrib[^\(]*)')
import_usage = re.compile('import\ tensorflow\.contrib.*')
commented_import_usage = re.compile('#.*(import\ tensorflow.contrib.*)')
from_import_usage = re.compile('from\ tensorflow import contrib.*')
commented_from_import_usage = re.compile('#.*(from\ tensorflow import contrib.*)')
```

The final step in data prep is to use the regex to find the api usage and statistics by merging repos and query collections using pre defined conditions. Again for simplicity 
sake I will be using [python dataclasses](https://docs.python.org/3/library/dataclasses.html) (I am lazy to write \_\_init__ :P) in 3.7. For 3.3+ users check out Erick's [dataclasses repo](https://github.com/ericvsmith/dataclasses). 
Also I like **Munch** !   

```python
from munch import Munch
import enum
from dataclasses import dataclass
import re
import base64


@dataclass
class Record(Munch):
    repo_name: str
    ...
    api: str


class UsageType(enum.Enum):
    Normal = enum.auto()
    Commented = enum.auto()

normal_usage = re.compile('tf\.contrib\.[^\(|^\s]*')
commented_usage = re.compile('#.*(tf\.contrib[^\(|^\s]*)')

API_USAGE = {}

def usage(api, line_no, repo_name, usage_type, query_details):
    repo_details = repos.find_one({"full_name": repo_name})
    r = Record(...)
    if api in API_USAGE:
        API_USAGE[api].append(r)
    else:
        API_USAGE[api] = [r]

for q_no, query in enumerate(queries.find()):
    lines = base64.b64decode(query['content']['content']).decode('utf-8').split('\n')
    for l_no, line in enumerate(lines):        
        n_usage = normal_usage.findall(line)
        if n_usage:            
            usage(n_usage[0], l_no+1, query['repository']['full_name'], UsageType.Normal, query)
```

At the end of this exercise, we have a dictionary with *API Name* as *key* and *statistics* as *values*. Using this data, 
lets come up with a simple algorithm to monitor the api usage. We will sum up the stats for each api and create a dataset for 
tabular visualization.

```python
@dataclass
class UsageStats(Munch):
    id: int
    ...
    updated_on: str
stats = []

for k, records in API_USAGE.items():
    _stars, _watchers, _forks, _issues, = 0, 0, 0, 0
    _created_on, _last_updated_on = [], []
    for record in records:
        _stars += record['stars']
        ...
        _last_updated_on.append(record['updated_on'])
    stats.append(UsageStats(...))
```

This leaves us with two files, one which has the [aggregated statistics](https://github.com/kingspp/tf-contrib-analyzer/blob/master/static/data/stats.json) and the other which provides [detailed information](https://github.com/kingspp/tf-contrib-analyzer/blob/master/static/data/usage.json). 

Some interesting results,

| Sl    | Topic                   | Total Repos | Code Query Repos |
|-------|-------------------------|-------------|------------------|
| 1     | neural-nets             | 200         | 0                |
| 2     | tensorflow              | 1100        | 0                |
| 3     | machine-learning        | 1000        | 0                |
| 4     | deeplearning            | 1000        | 6                |
| 5     | deep-learning           | 1100        | 3558             |
| 6     | tensorflow-contrib      | 1100        | 0                |
| 7     | distributed-training    | 1100        | 0                |
| 8     | artificial-intelligence | 500         | 0                |
| 9     | ai                      | 1100        | 0                |
| 10    | tf                      | 1100        | 0                |
| **Total** |                         | **10500**       | **3564**             |


#### Caveats:

1. Github search api provides 1000 best matched results along with the score.
2. There are few errors in the result provided by  Github code search api, such as duplicate keys, error in count of watchers and few others
3. Even though we had a filter for language as *python*, in the end we had results from *rst* and *md* file types.

[Sample Repo Query](https://jsoneditoronline.org/?id=524ccda2e2ce4991bf9f256b2c326092) | [Sample Code Query](https://jsoneditoronline.org/?id=1ae6018d072540d9ba451d114055744f)
 

That's it for now, see you in the next post!

