#!/bin/bash

# Deployment script for GCP App Engine
# Make sure you have gcloud CLI installed and configured

echo "========================================="
echo "Deploying College Search Backend to GCP"
echo "========================================="
echo ""

# Check if gcloud is installed
if ! command -v gcloud &> /dev/null; then
    echo "ERROR: gcloud CLI is not installed."
    echo "Please install it from: https://cloud.google.com/sdk/docs/install"
    exit 1
fi

# Check if user is authenticated
if ! gcloud auth list --filter=status:ACTIVE --format="value(account)" &> /dev/null; then
    echo "ERROR: No active gcloud account found."
    echo "Please run: gcloud auth login"
    exit 1
fi

# Get current project
PROJECT_ID=$(gcloud config get-value project 2> /dev/null)

if [ -z "$PROJECT_ID" ]; then
    echo "No GCP project selected."
    echo "Please run: gcloud config set project YOUR_PROJECT_ID"
    exit 1
fi

echo "Current GCP Project: $PROJECT_ID"
echo ""
echo "Deploying backend..."
echo ""

# Deploy to App Engine
gcloud app deploy app.yaml --quiet

echo ""
echo "========================================="
echo "Deployment Complete!"
echo "========================================="
echo ""
echo "View your app at: https://$PROJECT_ID.appspot.com"
echo "View logs: gcloud app logs tail -s default"
echo ""
