---
layout: post
title: Singleton's Skeleton!!
description: "Singleton - Python's obvious choice for global configuration"
author: kingspp
category: Design
tags: python design-pattern architecture
finished: false
---

**Singleton**, the name says it all - Comprises of a single entity. Often in python this pattern is overlooked.
But lately to my surprise, it is the key to success, for global configuration. Python is known to be a simple, easy
going noob's programming language. At the heart of its implementation, the easiness and the least learning curve raised 
its status as world's best programming language for a Data Scientist. But in reality python is such a pa^^ to develop
complex structures because of its - no restriction's rule. I do agree that restriction free language works best for prototyping,
but unfortunately to build a library it is cumbersome. Since its *python* - anything can be designed and implemented, **the sky's 
the limit**.

Lets say, you want to build a set of tools required for a project. As a developer evolves from a noob to 
an architect, his set of tools, evolve. This evolution brings in the concept of abstraction. So lets say we have 
a set of tools and we call it a library.

We will design the library - **Child monitoring suite**

```python

# config.json

'''
Lets assume that we have build a library and a flexible one. The library comes with set 
of configurable parameters. Lets say the configuration is in json format
'''  

library_config = {
'allowed_fruits':['apple', 'orange', 'banana'],
'fruits_limit_per_day': 8
}

```

Now we have a set of changeable conditions. The first one describes, allowed fruits for consumption, while 
the second one seems to be a limiting factor for the day. Next is to write a simple loader.

```python

# config.py

# As out config is in JSON Format, we will use json module to load the json file
import json

class LibraryConfiguration(object):
    
    def __init__(self, config_path:str):
        """
        Class Constructor
        config_path: Configuration File Path
        """
        self.config_data = json.load(open(config_path))
        self.ALLOWED_FRUITS = self.config_data['ALLOWED_FRUITS']
        self.FRUITS_LIMIT_PER_DAY = self.config_data['FRUIT_LIMIT_PER_DAY']
        
    
    def update_library_config(self, config_path:str):
        """
        Function to update library config
        config_path: Configuration File Path
        """
        self.__init__(config_path=config_path)

library_configuration  = LibraryConfiguration('config.json')
    
```

Lets start defining the functionalities for our library, we have three modules, namely morning and evening
consumptions - 


Morning Consumption Module
```python

# morning_consumption.py

# We need to import Configuration,
from config import library_configuration as config


class MorningConsumption(object):
    def __init__(self):
        pass
    
    def check_consumption_rate(self, consumed_fruits:int):
        if consumed_fruits > config.FRUIT_LIMIT_PER_DAY:
            return 'Bad Consumption Rate'
        else:
            return 'Good Consumption Rate'
```
 
Evening Consumption Module
```python

# evening_consumption.py

# We need to import Configuration,
from config import LibraryConfiguration

# Lets create configuration object and feed it with our config.json which we created earlier
config = LibraryConfiguration('config.json')

class EveningConsumption(object):
    def __init__(self):
        pass
    
    def check_consumption_rate(self, consumed_fruits:int):
        if consumed_fruits > config.FRUIT_LIMIT_PER_DAY:
            return 'Bad Consumption Rate'
        else:
            return 'Good Consumption Rate'
              
```


Our Main module
```python

# main.py

# Import morning and evening consumption modules
from morning_consumption import MorningConsumption
from evening_consumption import EveningConsumption

morning_consumption = MorningConsumption()
evening_consumption = EveningConsumption()


morning_consumption.check_consumption_rate(7) # Output: Good Consumption

'''           
Now lets say the child fell sick in the evening and the doctor advised to limit the 
number of fruits/day to just 4 and exclude banana.
'''
config.FRUIT_LIMIT_PER_DAY = 4
config.ALLOWED_FRUITS = ['apple', 'orange']  

evening_consumption.check_consumption_rate(7) # Output: Good Consumption (Something is missing here)
```

Even though we changed consumption limit after doctor's advice, our evening module did not 
warn us about the consumption rate. Ideally we should have got - **Bad Consumption (7>4)** but we 
got **Good Consumption**.

Reason - *To err is human*. We made a mistake when we created a new config object in our
evening module. To solve this we need to import the `config` object instead of `LibraryConfiguration` class
{or} we can have a restriction throughout our library stating that, only a single instance of the LibraryConfiguration
should exist. I like the second one as it give some room for mistakes :P. 

```python

# test.py

class SimpleClass(object):
    def __init__(self):
        pass
        
sample_1 = SimpleClass()
sample_2 = SimpleClass()

id(sample_1) # prints 4372114624
id(sample_1) # prints 4372114568
       
```

Our Goal is to have a single instance. Lets dive deep into Singleton Pattern

```python

# singleton.py

class Singleton(type):
    """
    Singleton Class
    """
    _instances = {}

    def __call__(cls, *args, **kwargs):
        if cls not in cls._instances:
            cls._instances[cls] = super(Singleton, cls).__call__(*args, **kwargs)
        return cls._instances[cls]
```

Such an intuitive design. As simple as it might seem, its usage benefits greatly. The ideology is simple - 
*When an instance for a class is created, store the instance and when a developer creates a new instance, return the
stored instance* Lets head back to our SimpleClass problem. Our goal is to have a single instance.

```python

# test.py

from singleton import Singleton

class SimpleClass(metaclass=Singleton):
    def __init__(self):
        self.var = 10
        pass
        
sample_1 = SimpleClass()
sample_2 = SimpleClass()

id(sample_1) # prints 4575457632
id(sample_1) # prints 4575457632

print(sample_1.var) # prints 10
sample_1.var = 25
print(sample_2.var) # prints 25
```

Aha, we now have a solution to our problem we faced in our library. Our **LibraryConfiguration** class
should have a metaclass (baseclass) as **Singleton**. This post might feel long for experienced developers,
but for starters, I feel its apt. For me programming was fun and simple when the explanation had a relation to 
real world example. It was fun explaining stuff. Signing off till next post.

 



