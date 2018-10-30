import numpy as np
import pickle
import gzip
#import matplotlib.pyplot as plt
#from pylab import *
import warnings
warnings.simplefilter('ignore')


def sigmoid_function(x):
    return np.nan_to_num(1/(1+np.exp(-x)))


def sigmoid_function_derivative(x):
    return sigmoid_function(x)*(1-sigmoid_function(x))


class cross_entropy_cost_function:
    @staticmethod
    def cross_entropy_cost(outputs, targets):
        return -np.nan_to_num(targets*np.log(outputs)+\
                             (1-targets)*np.log(1-outputs))
    @staticmethod
    def cross_entropy_cost_derivative(outputs, targets):
        return -np.nan_to_num(targets/outputs-(1-targets)/(1-outputs))
    @staticmethod
    def delta(inputs, outputs, targets):
        return outputs-targets
    
class neural_network:
    def __init__(self, shape, cost = cross_entropy_cost_function):
        self.shape = shape
        self.layers = len(shape)
        self.cost = cost        
        
        self.weights = [np.random.normal(0, 1/np.sqrt(shape[i+1]), (shape[i],shape[i+1]))
                       for i in range(self.layers-1)]
        self.biases = [np.random.normal(0, 1, (shape[i]))\
                      for i in range(1, self.layers)]
        
    def feed_forward(self, inputs):
        self.inputs_to_layer = {}
        self.outputs_from_layer = {}
        self.inputs_to_layer[0] = inputs
        self.outputs_from_layer[0] = np.array(inputs)
        
        for layer in range(1, self.layers):
            self.inputs_to_layer[layer] = np.dot(self.outputs_from_layer[layer-1],\
                                                 self.weights[layer-1])+self.biases[layer-1]
            self.outputs_from_layer[layer] = np.array(sigmoid_function(self.inputs_to_layer[layer]))
        return self.outputs_from_layer[self.layers-1]


    def load(self, file_name):
        with open(file_name, 'rb') as f:
            dataset = pickle.load(f, encoding='latin1')
        self.biases = dataset['Biases']
        self.weights = dataset['Weights']




        

with gzip.open('./testingset.pkl.gz','rb') as f:
    testing_set = pickle.load(f, encoding='latin1')


tes_data = [testing_set[0], testing_set[1]]


tes_data = list(tes_data)


testing_set        = [(testing_set[0][i], [1 if 1 == testing_set[1][i][j] else 0 for j in range(4)]) \
                    for i in np.arange(len(testing_set[0]))]




neural_network_construction = neural_network( [675,25,4] )


neural_network_construction.load("./Neural_Network")


ex_1_prediction = neural_network_construction.feed_forward(testing_set[0][0])

label=[0,0,0,0]
label[0]=ex_1_prediction[0]
label[1]=ex_1_prediction[1]
label[2]=ex_1_prediction[2]
label[3]=ex_1_prediction[3]

final1 = np.where(ex_1_prediction==max(ex_1_prediction))[0][0]
ex_1_prediction[final1]=0
final2 = np.where(ex_1_prediction==max(ex_1_prediction))[0][0]
    
emo_1=""
emo_2=""
    
if(final1==1):
  emo_1="anger"
  
elif(final1==0):
  emo_1="happiness"
  
elif(final1==2):
  emo_1="sadness"
  
elif(final1==3):
  emo_1="no_emotion"
  
if(final2==1):
  emo_2="anger"
  
elif(final2==0):
  emo_2="happiness"
  
elif(final2==2):
  emo_2="sadness"
  
elif(final2==3):
  emo_2="no_emotion"
  
  
    
print("{0},{1},{2},{3},{4},{5}".format(label[0],label[1],label[2],label[3],emo_1,emo_2))