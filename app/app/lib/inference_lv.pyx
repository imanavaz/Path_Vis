import numpy as np
import heapq as hq
import sys
cimport numpy as np


cdef class HeapItem:
    cdef readonly float priority
    cdef readonly object task, string
    
    def __init__(self, float priority, task):
        self.priority = priority
        self.task = task
        self.string = str(priority) + ': ' + str(task)
        
    def __richcmp__(self, other, int op):
        if op == 2: # ==
            return self.priority == other.priority
        elif op == 3: # !=
            return self.priority != other.priority
        elif op == 0: # <
            return self.priority < other.priority
        elif op == 1: # <=
            return self.priority <= other.priority
        elif op == 4: # >
            return self.priority > other.priority
        elif op == 5: # >=
            return self.priority >= other.priority
        else:
            assert False
            
    def __repr__(self):
        return self.string
    
    def __str__(self):
        return self.string


cpdef do_inference_list_viterbi(int ps, int L, int M,
                                np.ndarray[dtype=np.float64_t, ndim=2] unary_params, 
                                np.ndarray[dtype=np.float64_t, ndim=3] pw_params, 
                                np.ndarray[dtype=np.float64_t, ndim=2] unary_features, 
                                np.ndarray[dtype=np.float64_t, ndim=3] pw_features, 
                                int top=10):
    assert(L > 1)
    assert(M >= L)
    assert(ps >= 0)
    assert(ps < M)
    assert(top > 0)
    
    cdef int pi, pj, t, pk, parix, partition_index, partition_index_start, k_partition_index
    cdef long k, maxIter = long(1e6)
    cdef float priority, new_priority
    
    Cu = np.zeros(M, dtype=np.float)
    Cp = np.zeros((M, M), dtype=np.float)
    
    for pi in range(M):
        Cu[pi] = np.dot(unary_params[pi, :], unary_features[pi, :])
        for pj in range(M):
            Cp[pi, pj] = -np.inf if (pj == ps or pi == pj) else np.dot(pw_params[pi, pj, :], pw_features[pi, pj, :])
            
    Alpha = np.zeros((L, M), dtype=np.float)
    Beta  = np.zeros((L, M), dtype=np.float)
    
    for pj in range(M): Alpha[1, pj] = Cp[ps, pj] + Cu[pj]
    for t in range(2, L):
        for pj in range(M):
            Alpha[t, pj] = np.max([Alpha[t-1, pi] + Cp[pi, pj] + Cu[pj] for pi in range(M)])
    
    for pi in range(M): Beta[L-1, pi] = 0 
    for t in range(L-1, 1, -1):
        for pi in range(M):
            Beta[t-1, pi] = np.max([Cp[pi, pj] + Cu[pj] + Beta[t, pj] for pj in range(M)])
    Beta[0, ps] = np.max([Cp[ps, pj] + Cu[pj] + Beta[1, pj] for pj in range(M)])
    
    Fp = np.zeros((L-1, M, M), dtype=np.float)
    for t in range(L-1):
        for pi in range(M):
            for pj in range(M):
                Fp[t, pi, pj] = Alpha[t, pi] + Cp[pi, pj] + Cu[pj] + Beta[t+1, pj]
                
    y_best = np.ones(L, dtype=np.int) * (-1)
    y_best[0] = ps
    for t in range(1, L): y_best[t] = np.argmax(Fp[t-1, y_best[t-1], :])
    
    Q = []
    priority = -np.max(Alpha[L-1, :])
    partition_index = -1
    exclude_set = set()  
    hq.heappush(Q, HeapItem(priority, (y_best, partition_index, exclude_set)))
    
    results = []
    k = 0; y_last = None
    while len(Q) > 0 and k < maxIter:
        hitem = hq.heappop(Q)
        k_priority = hitem.priority
        (k_best, k_partition_index, k_exclude_set) = hitem.task
        k += 1; y_last = k_best
        
        if len(set(k_best)) == L:
            if len(results) == 0 or len(set(k_best) - set(results[-1])) > 0:
                results.append(k_best); top -= 1
                if top == 0: return results
        
        partition_index_start = 1
        if k_partition_index > 0:
            assert(k_partition_index < L)
            partition_index_start = k_partition_index

        for parix in range(partition_index_start, L):
            new_best = np.zeros(L, dtype=np.int) * (-1)
            new_best[:parix] = k_best[:parix]
            if len(set(new_best[:parix])) < parix: break
            
            new_exclude_set = set(k_best[:parix+1])
            if parix == partition_index_start: new_exclude_set = new_exclude_set | k_exclude_set
            candidate_points = [p for p in range(M) if p not in new_exclude_set]
            if len(candidate_points) == 0: continue
            candidate_maxix = np.argmax([Fp[parix-1, k_best[parix-1], p] for p in candidate_points])
            new_best[parix] = candidate_points[candidate_maxix]
            
            for pk in range(parix+1, L): new_best[pk] = np.argmax([Fp[pk-1, new_best[pk-1], p] for p in range(M)])
            
            new_priority = Fp[parix-1, k_best[parix-1], new_best[parix]]
            if k_partition_index > 0: new_priority += (-k_priority) - Fp[parix-1, k_best[parix-1], k_best[parix]]
            new_priority *= -1.0

            hq.heappush(Q, HeapItem(new_priority, (new_best, parix, new_exclude_set)))
            
    if len(Q) == 0:
        sys.stderr.write('WARN: empty queue, return the last one\n')
    results.append(y_last); top -= 1
    while len(Q) > 0 and top > 0:
        hitem = hq.heappop(Q)
        results.append(hitem.task[0]); top -= 1
    return results
