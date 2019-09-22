## Missing value treatment using Clustering Technique

#### What is clustering?
The task of grouping a set of objects in such a way that objects in the same group (called a cluster) are more similar (in some sense) to each other than to those in other groups (clusters). A common statistical techniques used in statistical analysis and EDA.

#### What is missing value treatment?
In a practical scenario, we often come across missing values in a dataset. The values could be either errors, later replaced by null or by default was missing / not entered. In such scenarios, the data cannot be fed to a model, since it is having null values. In order to use the dataset for modelling, we need to come up with a plan to fill those values. There are many methods availble for the analysis. For this time, lets use Clustering Approach.

#### Can clustering be used for missing value treatment?
Clustering is grouping of similar objects. As the objective of clustering is based on similarity, we can use the technique to find the mean of the closest cluster and replace the missing value. 
Methods of clustering techniques for missing value treatment</br>
<b>1. Column Ignore Clustering</b>:</br>
    Given a missing value, its column is said to ignored for the clustering mechanism. Once the clusters are formed, the mean of the missing value's column is calculated</br>
<b>2. Row Ignore Clustering</b>:</br>
    Given a missing value, the row is dropped, and KMeans is run on all the columns as input. Later the dropped sample is compared against the cluster centroid and the mean is computed based on the cluster.

## Dataset and its Features
#### Context
The Iris flower data set is a multivariate data set introduced by the British statistician and biologist Ronald Fisher in his 1936 paper The use of multiple measurements in taxonomic problems. It is sometimes called Anderson's Iris data set because Edgar Anderson collected the data to quantify the morphologic variation of Iris flowers of three related species. The data set consists of 50 samples from each of three species of Iris (Iris Setosa, Iris virginica, and Iris versicolor). Four features were measured from each sample: the length and the width of the sepals and petals, in centimeters.

This dataset became a typical test case for many statistical classification techniques in machine learning such as support vector machines

#### Content
The dataset contains a set of 150 records under 5 attributes - Petal Length, Petal Width, Sepal Length, Sepal width and Class(Species).


```python
# Let us load the data
from sklearn import datasets
import numpy as np
# Set a seed to get same clusters
np.random.seed(2)

# Import IRIS data from sklearn.datasets - https://www.kaggle.com/arshid/iris-flower-dataset
iris = datasets.load_iris()
X = iris.data
y = iris.target

# Load the data into a pandas dataframe, so its easy to work with
import pandas as pd
df = pd.DataFrame(data=np.concatenate([X,np.reshape(y, [-1,1])], axis=1), columns=["sl", "sw","pl", "pw", "class"])
print(df.head())
print(df.describe())
```

        sl   sw   pl   pw  class
    0  5.1  3.5  1.4  0.2    0.0
    1  4.9  3.0  1.4  0.2    0.0
    2  4.7  3.2  1.3  0.2    0.0
    3  4.6  3.1  1.5  0.2    0.0
    4  5.0  3.6  1.4  0.2    0.0
                   sl          sw          pl          pw       class
    count  150.000000  150.000000  150.000000  150.000000  150.000000
    mean     5.843333    3.057333    3.758000    1.199333    1.000000
    std      0.828066    0.435866    1.765298    0.762238    0.819232
    min      4.300000    2.000000    1.000000    0.100000    0.000000
    25%      5.100000    2.800000    1.600000    0.300000    0.000000
    50%      5.800000    3.000000    4.350000    1.300000    1.000000
    75%      6.400000    3.300000    5.100000    1.800000    2.000000
    max      7.900000    4.400000    6.900000    2.500000    2.000000


Applying an initial clustering on the data will help us in understanding the benchmarks. Once the benchmarks are set, we can use the same for further comparison and analysis. 

## Benchmark Index

To set an initial benchmark, we will use KMeans with n_cluster=3 (Because of 3 species in the target class).


```python
from sklearn.cluster import KMeans
np.random.seed(2)
km = KMeans(n_clusters=3)
km.fit(df[["sl", "sw", "pl", "pw"]])
df['cluster'] = km.labels_
gp =df.groupby("cluster")

avg_std = []
for g in gp:
    avg_std.append(g[1]['class'].std())
    print(f"Cluster {g[0]} std: {avg_std[-1]}")
print(f"Average Std: {sum(avg_std)/len(avg_std)}")
```

    Cluster 0 std: 0.0
    Cluster 1 std: 0.42152552141429817
    Cluster 2 std: 0.22629428592141423
    Average Std: 0.21593993577857082


The Standard Deviation of column "class" in a cluster ideally should be 0. It is 0.21 in this case, which will be the benchmark index for comparions. Standard deviation will be used as metric for measuring the cluster performance.

## Masking
#### Random masking of pl column


```python
import random
np.random.seed(2)
random.seed(2)
MASKED_CANDIDATES = [random.randrange(0, len(df)) for i in range(5)]
ACTUAL_VALUES  = np.array([df.loc[[id]]["pl"].tolist()[0] for id in MASKS_CANDIDATES])

print(f"Masked Candidates: {MASKED_CANDIDATES}")
print(f"Actual Values of the mask: {ACTUAL_VALUES}")
```

    Masked Candidates: [14, 23, 21, 92, 43]
    Actual Values of the mask: [1.2 1.7 1.5 4.  1.6]


## Single Column Missing Value Treament

### Column Based Ignore
    Given a missing value, its column is said to ignored for the clustering mechanism. Once the clusters are formed, the mean of the missing value's column is calculated</br>
    
<b>Steps:</b></br>
1. Find the column with missing values and drop it
2. Apply clustering on the other columns and form groups.
3. For the missing value candidate, find the cluster for which it belongs.
4. Take the average of the said column for the given cluster.
5. The above mean is said to be predicted replaement for the missing value.


```python
%%time
m_df = df.copy()
# Setting mask candidates
for cand in MASKS_CANDIDATES:
    m_df.at[cand, 'pl'] = None
km = KMeans(n_clusters=3)
# Ignoring first column, create clusters
km.fit(m_df[["sl","sw", "pw"]].to_numpy())


# Approximate the mising values
print("Approximation:")
approx_vals = []
m_df['cluster'] = km.labels_
gp = m_df.groupby('cluster')
for ma in MASKS_CANDIDATES:
    mc = m_df.loc[[ma]]['cluster']
    approx_vals.append(df['pl'][gp.get_group(mc.tolist()[0]).index].mean())
for i in zip(MASKS_CANDIDATES, ACTUAL_VALUES, approx_vals):
    print(f"Candidate: {i[0]}, Actual PL: {i[1]}, Predicted PL: {i[2]}")
print(f"Euclidean Distance between actual and predictions: {np.linalg.norm(ACTUAL_VALUES-approx_vals)}\n")

print("Cluster Performance:")
avg_std = []
for g in gp:
    avg_std.append(g[1]['class'].std())
    print(f"Cluster {g[0]} std: {avg_std[-1]}")
print(f"Average Std: {sum(avg_std)/len(avg_std)}")
```

    Approximation:
    Candidate: 14, Actual PL: 1.2, Predicted PL: 1.4620000000000002
    Candidate: 23, Actual PL: 1.7, Predicted PL: 1.4620000000000002
    Candidate: 21, Actual PL: 1.5, Predicted PL: 1.4620000000000002
    Candidate: 92, Actual PL: 4.0, Predicted PL: 4.381481481481481
    Candidate: 43, Actual PL: 1.6, Predicted PL: 1.4620000000000002
    Euclidean Distance between actual and predictions: 0.539725968166537
    
    Cluster Performance:
    Cluster 0 std: 0.0
    Cluster 1 std: 0.43126597148888435
    Cluster 2 std: 0.4521089644358651
    Average Std: 0.2944583119749165
    CPU times: user 42.3 ms, sys: 3.54 ms, total: 45.9 ms
    Wall time: 43.6 ms


### Row based Ignore
Given a missing value, the row is dropped, and KMeans is run on all the columns as input. Later the dropped sample is compared against the cluster centroid and the mean is computed based on the cluster.

#### Steps:
1. Find and drop the masked candidates
2. Apply Clustering considering every column
3. Once centroid is obtained, compute the nearby cluster to the masked candidate. 
4. To calculate the distance, ignore the masked values from candidate and centroid.
    Ex: Candidate - [1,2,4,9]
        Mask      - [1,None,4,9]
        Centroid  - [1,3,5,8]
        Distance  - || [1,4,9] - [1,5,8] || (None from Mask and 3 from centroid are ignored).
5. Take the average of the said column for the given cluster.
6. The above mean is said to be predicted replaement for the missing value.


```python
%%time
np.random.seed(2)

m_df = df.drop(MASKS_CANDIDATES)

km = KMeans(n_clusters=3)
km.fit(m_df[["sl","sw", "pl","pw"]].to_numpy())
m_df['cluster'] = km.labels_
gp = m_df.groupby('cluster')
print("Approximation:")
approx_vals = []
for cand in MASKS_CANDIDATES:
    dist = [np.linalg.norm(df.loc[[cand], ['sl','sw','pw']].to_numpy() - centroid[[0,1,3]]) for centroid in km.cluster_centers_]
    cluster = np.argmin(dist)
    approx_vals.append(gp.get_group(cluster)["pl"].mean())

for i in zip(MASKS_CANDIDATES, ACTUAL_VALUES, approx_vals):
    print(f"Candidate: {i[0]}, Actual PL: {i[1]}, Predicted PL: {i[2]}")
print(f"Euclidean Distance between actual and predictions: {np.linalg.norm(ACTUAL_VALUES-approx_vals)}\n")

print("Cluster Performance:")
avg_std = []
for g in gp:
    avg_std.append(g[1]['class'].std())
    print(f"Cluster {g[0]} std: {avg_std[-1]}")
print(f"Average Std: {sum(avg_std)/len(avg_std)}")
```

    Approximation:
    Candidate: 14, Actual PL: 1.2, Predicted PL: 1.4586956521739132
    Candidate: 23, Actual PL: 1.7, Predicted PL: 1.4586956521739132
    Candidate: 21, Actual PL: 1.5, Predicted PL: 1.4586956521739132
    Candidate: 92, Actual PL: 4.0, Predicted PL: 4.4
    Candidate: 43, Actual PL: 1.6, Predicted PL: 1.4586956521739132
    Euclidean Distance between actual and predictions: 0.5539171387467207
    
    Cluster Performance:
    Cluster 0 std: 0.4240063923634021
    Cluster 1 std: 0.0
    Cluster 2 std: 0.22629428592141423
    Average Std: 0.21676689276160543
    CPU times: user 43.4 ms, sys: 3.03 ms, total: 46.4 ms
    Wall time: 44.2 ms


## Multi Column Missing Value Treament

## Row Based Ignore


```python
%%time
# Increasing the columsn having missing values to 2
# Random masking of sl and pw column
np.random.seed(2)
random.seed(2)
PL_MASKS_CANDIDATES = [random.randrange(0, len(df)) for i in range(5)]
PW_MASKS_CANDIDATES = [random.randrange(0, len(df)) for i in range(5)]
PL_ACTUAL_VALUES  = np.array([df.loc[[id]]["pl"].tolist()[0] for id in SL_MASKS_CANDIDATES])
PW_ACTUAL_VALUES  = np.array([df.loc[[id]]["pw"].tolist()[0] for id in PW_MASKS_CANDIDATES])
m_df = df.copy()


# Setting mask candidates
for scand, pcand in zip(SL_MASKS_CANDIDATES, PW_MASKS_CANDIDATES):
    m_df.at[cand, 'pl']=None
    m_df.at[cand, 'pw']=None


    
km = KMeans(n_clusters=3)
# Ignoring first column, create clusters
km.fit(m_df[["sl", "sw"]].to_numpy())


# Approximate the mising values
print("Approximation: ")
approx_vals_pl = []
approx_vals_pw = []
m_df['cluster'] = km.labels_
gp = m_df.groupby('cluster')
for plma, pwma in zip(PL_MASKS_CANDIDATES, PW_MASKS_CANDIDATES):
    plmc = m_df.loc[[plma]]['cluster']
    pwmc = m_df.loc[[pwma]]['cluster']
    approx_vals_pl.append(df['pl'][gp.get_group(smc.tolist()[0]).index].mean())
    approx_vals_pw.append(df['pw'][gp.get_group(pmc.tolist()[0]).index].mean())
for i in zip(MASKS_CANDIDATES, PL_ACTUAL_VALUES, approx_vals_pl, PW_ACTUAL_VALUES, approx_vals_pw):
    print(f"Candidate: {i[0]}, Actual PL: {i[1]}, Predicted PL: {i[2]}, Actual PW: {i[3]}, Predicted PW: {i[4]}")
DIST = [np.linalg.norm(PL_ACTUAL_VALUES-approx_vals_pl), np.linalg.norm(PW_ACTUAL_VALUES-approx_vals_pw)]
print(f"Euclidean Distance between actual and predictions: {DIST}")
print(f"Mean Euclidean Distance: {sum(DIST)/len(DIST)}\n")

print("Cluster Performance:")
avg_std = []
for g in gp:
    avg_std.append(g[1]['class'].std())
    print(f"Cluster {g[0]} std: {avg_std[-1]}")
print(f"Average Std: {sum(avg_std)/len(avg_std)}")
```

    Approximation: 
    Candidate: 14, Actual PL: 1.2, Predicted PL: 1.4620000000000002, Actual PW: 1.5, Predicted PW: 1.4339622641509433
    Candidate: 23, Actual PL: 1.7, Predicted PL: 1.4620000000000002, Actual PW: 1.3, Predicted PW: 1.4339622641509433
    Candidate: 21, Actual PL: 1.5, Predicted PL: 1.4620000000000002, Actual PW: 1.5, Predicted PW: 1.4339622641509433
    Candidate: 92, Actual PL: 4.0, Predicted PL: 1.4620000000000002, Actual PW: 0.1, Predicted PW: 1.4339622641509433
    Candidate: 43, Actual PL: 1.6, Predicted PL: 1.4620000000000002, Actual PW: 2.3, Predicted PW: 1.4339622641509433
    Euclidean Distance between actual and predictions: [2.566558006357931, 1.5987947133456057]
    Mean Euclidean Distance: 2.0826763598517686
    
    Cluster Performance:
    Cluster 0 std: 0.0
    Cluster 1 std: 0.45477629710263706
    Cluster 2 std: 0.4407545460261734
    Average Std: 0.2985102810429368
    CPU times: user 54.3 ms, sys: 3.17 ms, total: 57.5 ms
    Wall time: 55.4 ms


### Column Based Igore


```python
%%time
np.random.seed(2)
m_df = df.drop(PL_MASKS_CANDIDATES)
m_df = df.drop(PW_MASKS_CANDIDATES)

km = KMeans(n_clusters=3)
km.fit(m_df[["sl", "sw", "pl", "pw"]].to_numpy())
m_df['cluster'] = km.labels_
gp = m_df.groupby('cluster')

approx_vals_pl = []
approx_vals_pw = []
for plcand, pwcand in zip(PL_MASKS_CANDIDATES, PW_MASKS_CANDIDATES):
    pldist = [np.linalg.norm(df.loc[[cand], ['sl','sw','pw']].to_numpy() - centroid[[0,1,3]]) for centroid in km.cluster_centers_]
    pwdist = [np.linalg.norm(df.loc[[cand], ['sl','sw','pl']].to_numpy() - centroid[[0,1,2]]) for centroid in km.cluster_centers_]
    plcluster = np.argmin(pldist)
    pwcluster = np.argmin(pwdist)
    approx_vals_pl.append(gp.get_group(plcluster)["pl"].mean())
    approx_vals_pw.append(gp.get_group(pwcluster)["pw"].mean())

for i in zip(MASKS_CANDIDATES,PL_ACTUAL_VALUES, approx_vals_pl, PW_ACTUAL_VALUES, approx_vals_pw):
    print(f"Candidate: {i[0]}, Actual PL: {i[1]}, Predicted PL: {i[2]}, Actual PW: {i[3]}, Predicted PW: {i[4]}")
DIST = [np.linalg.norm(SL_ACTUAL_VALUES-approx_vals_sl), np.linalg.norm(PW_ACTUAL_VALUES-approx_vals_pw)]
print(f"Euclidean Distance between actual and predictions: {DIST}")
print(f"Mean Distance: {sum(DIST)/len(DIST)}")
print(f'Time Required: {time.time()-start}')

print("Cluster Performance:")
avg_std = []
for g in gp:
    avg_std.append(g[1]['class'].std())
    print(f"Cluster {g[0]} std: {avg_std[-1]}")
print(f"Average Std: {sum(avg_std)/len(avg_std)}")
```

    Candidate: 14, Actual PL: 1.2, Predicted PL: 1.4612244897959183, Actual PW: 1.5, Predicted PW: 0.24897959183673468
    Candidate: 23, Actual PL: 1.7, Predicted PL: 1.4612244897959183, Actual PW: 1.3, Predicted PW: 0.24897959183673468
    Candidate: 21, Actual PL: 1.5, Predicted PL: 1.4612244897959183, Actual PW: 1.5, Predicted PW: 0.24897959183673468
    Candidate: 92, Actual PL: 4.0, Predicted PL: 1.4612244897959183, Actual PW: 0.1, Predicted PW: 0.24897959183673468
    Candidate: 43, Actual PL: 1.6, Predicted PL: 1.4612244897959183, Actual PW: 2.3, Predicted PW: 0.24897959183673468
    Euclidean Distance between actual and predictions: [0.8060366483586924, 2.909231454378233]
    Mean Distance: 1.8576340513684626
    Time Required: 583.1237587928772
    Cluster Performance:
    Cluster 0 std: 0.2732763127330939
    Cluster 1 std: 0.0
    Cluster 2 std: 0.4316571425184985
    Average Std: 0.23497781841719748
    CPU times: user 57.2 ms, sys: 2.36 ms, total: 59.5 ms
    Wall time: 58.4 ms


### Results
| Type                 | Error Norm(Predictions-Actuals) | Cluster Performance (Avg Std) | Time Required in ms |
|----------------------|---------------------------------|-------------------------------|---------------------|
| Benchmark Index      | -                               | 0.21593993577857082           | 39.4                |
| Single Column Ignore | 0.549725968166537               | 0.2944583119749165            | 53.6                |
| Single Row Ignore    | 0.5539171387467207              | 0.21676689276160543           | 51.5                |
| Multi-Column Ignore  | 2.0826763598517686              | 0.2985102810429368            | 55.7                |
| Multi-Row Ignore     | 1.8576340513684626              | 0.23497781841719748           | 62.8                |

### Conclusion

Based on the findings,

| Sl | Column Based Ignore                                  | Row Based Ignore                                                              |
|----|------------------------------------------------------|-------------------------------------------------------------------------------|
| 1  | Suitable for when a single column has missing values | Suitable for missing value treatment when multiple columns has missing values |
| 2  | Not scalable                                         | Scalable Solution                                                             |
| 3  | Column saliency is not considered                    | Column saliency is considered                                                 |
| 4  | Theoretical approach                                 | Practical approach                                                            |
| 5  | Cannot use cluster drivers                           | Can be used on cluster drivers                                                |
