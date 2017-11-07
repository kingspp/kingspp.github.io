---
layout: post
title: The head and tail of logging ~~~~@
description: "Logging in Python - The Why's? How's? Do's and Dont's"
author: kingspp
category: Design
tags: python design-pattern architecture logging
finished: true
---

**Logging**, can be defined as recording of application state at respective time interval's or module level functionalities. Python has an inbuilt
extensible logging framework. One can ask, why do we need logs? we can just print status in console!, but unfortunately the power of logging is realised
only when there is a critical failure in the system and one has to debug the root cause. Without logging, its next to impossible to debug
an application with several modules and interfaces. Even thought at times it can be done, but it gets tedious. Also logging can used to track the application's
state and progress.

Lets start with a simple example

```python
# logging.py

# First we need to import logging module
import logging

# Create logger object with respective module name
logger = logging.getLogger(__name__)

# Log - The statement does not print in console as we have not defined 
# the handlers at this stage
logger.info('sample log') 
```

As a rule of thumb, this seems to be the right way of calling loggers in every module, i.e every module - 
* Imports logging module - `import logging`
* Create logger object with respective module name - `logger = logging.getLogger(__name__)` 
* Use logger object for the module to perform logging - `logger.info("sample log")`

The flow of logging is as follows,

![Logging Flow Diagram](/assets/img/posts/logging_flow.png?raw=true)

### The Root Logger
Python logging maintains hierarchy. When we create logger objects in each module, every object created is attached to its 
immediate parent module. Root logger - as the name suggests, is the most primitive logger object created when we import logging module. Hence
when a property of root logger is modified, the modification is applicable to all the loggers created during run-time. So 
we can say that by default, logger hierarchy support top to bottom configuration passing. But there is way where in which, 
a configuration is modified in the child logger and passed on to the parent which is bottom to top configuration message passing architecture.
 
```python
# sample.py

import logging

# Create Logger objects
logger = logging.getLogger(__name__)
logger_level_1 = logging.getLogger(__name__+'.level_1')
logger_level_2 = logging.getLogger(__name__+'.level_1.level_2')
logger_level_3 = logging.getLogger(__name__+'.level_1.level_2.level_3')

print(logger.parent) # Output: <RootLogger root (WARNING)>
print(logger_level_1.parent) # Output: <Logger __main__ (WARNING)>
print(logger_level_2.parent) # Output: <Logger __main__.level_1 (WARNING)>
print(logger_level_3.parent) # Output: <Logger __main__.level_1.level_2 (WARNING)>
```

### Log Record
Log Record instances are created every time there is a call to logger.log function. It contains various types of information related to the respective event. One can thing of it as a **store** - which pertains information related to the object.
Some of the attributes of log record includes *exc_info, levelname, levelno, processname, module* and others, for more details regarding log record attributes pls visit - [Log Record Attributes](https://docs.python.org/3/library/logging.html#logrecord-attributes)

### Handlers, Formatters and Filters

```python
# sample.py

# Import Standard Output and Standard Error streams - Will be used in setting 
# respective streams for StreamHandler
from sys import stdout, stderr

# Import logging module and create logger object
import logging

from theano.tests import record

logger = logging.getLogger(__name__)

# Lets set initial level for logger as INFO
logger.setLevel(logging.INFO)

# Now lets create two different handlers as we need different formatting 
# for different levels

# Info Handler - Logging Level: INFO
info_handler = logging.StreamHandler(stream=stdout)
info_handler.setLevel(logging.INFO)
info_handler.setFormatter(logging.Formatter(fmt="%(asctime)s - %(levelname)s - %(name)s(%(lineno)d) - %(message)s"))

# Error Handler - Logging Level: ERROR
error_handler = logging.StreamHandler(stream=stderr)
error_handler.setLevel(logging.ERROR)
error_handler.setFormatter(logging.Formatter(
    fmt='%(asctime)s - %(levelname)s <PID %(process)d:%(processName)s> %(name)s.%(funcName)s(): %(message)s'))

# Next is to add handlers to our logger object
logger.addHandler(info_handler)
logger.addHandler(error_handler)

# Check handlers
print(logger.handlers)

# Lets test our Formatters!!
logger.info('sample')
logger.error('sample')

"""
Output: Error

2017-11-07 00:38:28,295 - ERROR <PID 59859:MainProcess> __main__.<module>(): sample
[<StreamHandler <stdout> (INFO)>, <StreamHandler <stderr> (ERROR)>]
2017-11-07 00:38:28,295 - INFO - __main__(52) - sample
2017-11-07 00:38:28,295 - ERROR - __main__(53) - sample (Unexpected Log)

"""


```
The issue we are facing now is that Error level is > INFO level and hence we have 
info and error logs coming from info handler and only error logs from error handler. 
How do we disable error logs on info handler? - We use filters
```python

# filter.py


class InfoFilter(logging.Filter):
    """
    Simple Filter class
    """
    def __init__(self):
        """
        Constructor
        """
        super().__init__(name='filter_info_logs')

    def filter(self, record):
        """
        Return Log Record Object based on condition - Return only info logs
        :param record: Log Record Object
        :return: Log Record Object
        """
        assert isinstance(record, logging.LogRecord)
        if record.levelno == logging.INFO:
            return record

# Add the filter
info_handler.addFilter(filter=FilterInfoLogs())

# Lets test our new filter configuration
logger.info('sample')
logger.error('sample')

"""
Output: Expected

2017-11-07 00:41:00,797 - ERROR <PID 60033:MainProcess> __main__.<module>(): sample
2017-11-07 00:41:00,797 - INFO - __main__(96) - sample
"""

```

Now we have an idea on the usage of handlers, formatters and filters. Configuring these modules using 
statements is a tedious process, but we have multiple way of configuring logging module - 
* Inline Configuration - `logging.basicConfig(level=..., fmt=...)`
* Dictionary based Configuration - dictConfig
* YAML based Configuration - pyYaml

For my usage, the last one i.e YAML based configuration provides interesting way to configure logging module, let start with a basic example

```yaml
# logging_config.yaml


# Default Configuration
version: 1

# Disable previously created loggers and update the root logger at the instant 
#the configuration file is fed.
disable_existing_loggers: true

# Refer filter block for detailed explanation
filters:
    # These are callable modules, where we define class for a filter, upon 
    #execution an object for the class will be created by log manager
    # Format:
    # filter_name:
    #       () : filter class path
    info_filter:
        () : module.filter.InfoFilter    

# Logging formatter definition
# For more details on format types, 
# visit - 'https://docs.python.org/3/library/logging.html#logrecord-attributes
formatters:
    # Format:
    # formatter_name:
    #         format: "fmt_specified using pre-defined variables"
    standard:
        format: "%(asctime)s - %(levelname)s - %(name)s(%(lineno)d) - %(message)s"    
    error:
        format: "%(asctime)s - %(levelname)s <PID %(process)d:%(processName)s> %(name)s.%(funcName)s(): %(message)s"

# Logging handlers
# Console and Error Console belongs to StreamHandler whereas info_file_handler belongs to Rotating File Handler
# For a list of pre-defined handlers, visit - 'https://docs.python.org/3/library/logging.handlers.html#module-logging.handlers'
handlers:
    # Format:
    # handler_name:
    #       handler_attributes: attribute values
    info_file_handler:
        # Class Attribute - Define FileHandler, StreamHandler among other handlers
        class: logging.handlers.RotatingFileHandler
        # Handler Level
        level: INFO
        # Custom Format defined in formatter block 
        formatter: standard
        # File Name
        filename: /tmp/info.log
        # Max store value - 10 MB
        maxBytes: 10485760 
        # Backup count - Rollover attribute
        backupCount: 20
        # Log format encoding
        encoding: utf8
        
    console:
        class: logging.StreamHandler
        level: DEBUG
        formatter: standard 
        filters: [info_filter]
        stream: ext://sys.stdout
        
    error_console:
        class: logging.StreamHandler
        level: ERROR
        formatter: error
        stream: ext://sys.stderr
        
   
# Root Logger Configuration
root:
    # Logger Level - Set to NOTSET if you have child loggers with pre-defined levels
    level: NOTSET
    # Attach handlers for Root Logger
    handlers: [console, error_console]
    # Stop propogation from child to parent in Logging hierarchy
    propogate: no


# Module level configuration
loggers:
    module1:
        level: INFO
        handlers: [info_file_handler, error_file_handler, critical_file_handler, debug_file_handler, warn_file_handler]
        propogate: no

    module1.sub_module1:
        level: INFO
        handlers: [info_file_handler, error_file_handler, critical_file_handler, debug_file_handler, warn_file_handler]
        propogate: no
```

We have defined logging configuration in our previous block, now lets see how to load this configuration,

```python
# logging_config_manager.py

# Import Required modules
import os
import logging
import sys
import yaml

"""
This function is used to setup root logging configuration,
* If LOG_CFG variable is set, then use it for logging configuration path
* Since we are using yaml configuration, we need yaml module to load configuration file
* Set Root logger configuration using `logging.config.dictConfig()`
* Any exception results in setting up root logger in default configuration. 
"""


# Function to configure root logger 
def setup_logging(default_path='logging.yaml', default_level=logging.INFO, env_key='LOG_CFG'):
    """    
    | Logging Setup
    |
    :param default_path: Logging configuration path
    :param default_level: Default logging level
    :param env_key: Logging config path set in environment variable
    """
    path = default_path
    value = os.getenv(env_key, None)
    if value:
        path = value
    if os.path.exists(path):
        with open(path, 'rt') as f:
            try:
                config = yaml.safe_load(f.read())
                logging.config.dictConfig(config)                
            except Exception as e:
                print('Error in Logging Configuration. Using default configs', e)
                logging.basicConfig(level=default_level, stream=sys.stdout)                
    else:
        logging.basicConfig(level=default_level, stream=sys.stdout)        
        print('Failed to load configuration file. Using default configs')


```

We have defined a function which can be used for configuring Root Logger, which stands atop logging hierarchy, now let see how we can use this function,
Open **__init__.py** of main module. Why we need to use **__init__.py** will be discussed in upcoming posts, for the time being bear with me,

```python
# __init__.py

# Import required modules
import os
from logging_config_manager import setup_logging

# Should be the first statement in the module to avoid circular dependency issues.
setup_logging(default_path=os.path.join("/".join(__file__.split('/')[:-1]), 'config', 'logging_config.yaml'))

```


So whenever our main module is imported, setup_logging method will be called which sets Root Logger and module level
logging configurations. Have fun logging!!

