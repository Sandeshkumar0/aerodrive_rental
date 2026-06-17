# face-api.js models

This folder is intended to contain the **face-api.js** model files used by the frontend for an *in-browser* pre-check.

## What this is for
Before uploading the selfie to the backend, the UI can:
- detect whether a face is present (instant feedback)
- compute a rough similarity score between the license photo and selfie (best-effort)

**Important:** this is only a UX pre-check. The backend CNN match remains authoritative.

## How to populate this folder
Download the model files from the official face-api.js weights and place them here.

Minimum set used by this project:
- `tiny_face_detector_model-weights_manifest.json` + shard files
- `face_landmark_68_model-weights_manifest.json` + shard files
- `face_recognition_model-weights_manifest.json` + shard files

This repo intentionally does not commit the binary weights.
