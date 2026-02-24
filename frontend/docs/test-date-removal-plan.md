# Test Date Override Removal Plan

This document provides step-by-step instructions for removing the temporary test date override feature used for debugging routine system bugs.

## Overview

The test date override feature allows developers to simulate different dates to test routine daily rollover logic, streak calculations, and completion state. This feature is temporary and should be removed once routine system bugs are resolved.

## Scope

The test date override affects **ONLY** routine-related logic:
- Morning/evening routine completion checks
- Routine streak calculations  
- Routine daily rollover logic (resetting checkboxes)

It does **NOT** affect:
- Task completion timestamps
- Today Earns calculation
- Payroll submission dates
- Spend tracking dates

## Files to Modify/Delete

### 1. Delete Test-Only Files

Delete the following files entirely:

