import numpy as np, shap, lime, lime.lime_tabular
from predict import bilstm, xgb, VITAL_COLS

np.random.seed(42)  # For reproducibility
# Simulate a standardized dataset (mean=0, std=1) to provide variance for LIME & SHAP
BACKGROUND = np.random.randn(100, 48)

# Feature names for LIME (48 features: Hour1_HR ... Hour6_Temp)
LIME_FEATURES = [f"Hour{h+1}_{v}" for h in range(6) for v in VITAL_COLS]

def get_shap(normalized):
    """Returns bar_values (8,) and heatmap_values (6,8)"""
    X_flat = normalized.reshape(1, -1)  # (1,48)
    
    def bilstm_predict_flat(X):
        return bilstm.predict(X.reshape(-1,6,8), verbose=0).flatten()
    
    # Use small background — precomputed from validation set ideally
    background = shap.kmeans(BACKGROUND, 1)
    explainer = shap.KernelExplainer(bilstm_predict_flat, background)
    shap_vals = explainer.shap_values(X_flat, nsamples=50)  # fast for 1 sample
    
    vals_6x8 = np.array(shap_vals).reshape(6, 8)
    bar_vals  = np.abs(vals_6x8).mean(axis=0)  # (8,) averaged over hours
    return bar_vals.tolist(), vals_6x8.tolist()

def get_lime(normalized, background_flat):
    """background_flat: (N,48) array from val set — pass in at startup"""
    X_flat = normalized.reshape(-1)  # (48,)
    
    def bilstm_predict(X):
        probs = bilstm.predict(X.reshape(-1,6,8), verbose=0)
        return np.hstack([1-probs, probs])
    
    explainer = lime.lime_tabular.LimeTabularExplainer(
        background_flat, feature_names=LIME_FEATURES,
        class_names=["No Sepsis","Sepsis"], mode="classification"
    )
    exp = explainer.explain_instance(X_flat, bilstm_predict, num_features=10)
    top10 = [{"feature": f, "weight": w} for f,w in exp.as_list()]
    return top10