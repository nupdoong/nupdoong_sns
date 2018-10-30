import numpy as np
from numpy import genfromtxt
from PIL import Image
import gzip
import pickle
from glob import glob
import pandas as pd
import random


data = "./uploads/temp.jpg"


def data_processing(glob_files):
    dataset = []
    print("Open File(s):\n%s" %glob_files)
    for file_count, file_name in enumerate (sorted(glob(glob_files), key=len)):
        img = Image.open(file_name)
        img = img.resize((15,15))
        pixels = [f[0] for f in list(img.getdata())]+[f[1] for f in list(img.getdata())]+[f[2] for f in list(img.getdata())]
        dataset.append(pixels)
    return np.array(dataset)


testingdatasetsize = 1


TSDSS = testingdatasetsize


tes_set_x = list()


Data = data_processing(data)


tes_set_y = Data[0:TSDSS]


temp=random.randrange(0,4)
temp_arr=[0,0,0,0]
temp_arr[temp]=temp_arr[temp]+1


tes_set_x.append(temp_arr)
    
len_tes_set_x = len(tes_set_x)
len_tes_set_y = len(tes_set_y)


print ("\nRESULT")
print ("Testing Dataset X Length: %s" %len_tes_set_x)
print ("Testing Dataset Y Length: %s" %len_tes_set_y)
print ("")


tes_dataset_x = list()
tes_dataset_y = list()


arr = np.arange(len(tes_set_x))
for i in arr:
    tes_dataset_x.append(tes_set_x[i])
    tes_dataset_y.append(tes_set_y[i])


testing_dataset = [tes_dataset_y, tes_dataset_x]


f = gzip.open('testingset.pkl.gz','wb')


pickle.dump(testing_dataset, f)


print ("DATASET IS MADE COMPLETELY!")


f.close()
