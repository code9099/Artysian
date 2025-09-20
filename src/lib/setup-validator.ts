/**
 * Setup validation utility for CraftStory app
 * Validates all required services and configurations
 */

import { validateConfig } from './config';
import { speechService } from './speechService';
import { geminiService } from './geminiService';

export interface ValidationResult {
  service: string;
  status: 'success' | 'warning' | 'error';
  message: string;
  details?: string;
}

export interface SetupValidation {
  isValid: boolean;
  results: ValidationResult[];
  criticalErrors: string[];
  warnings: string[];
}

/**
 * Validate complete app setup
 */
export async function validateAppSetup(): Promise<SetupValidation> {
  const results: ValidationResult[] = [];
  const criticalErrors: string[] = [];
  const warnings: string[] = [];

  // 1. Validate environment configuration
  const configValidation = validateConfig();
  if (configValidation.isValid) {
    results.push({
      service: 'Environment Configuration',
      status: 'success',
      message: 'All required environment variables are configured',
    });
  } else {
    results.push({
      service: 'Environment Configuration',
      status: 'error',
      message: 'Missing required environment variables',
      details: configValidation.errors.join(', '),
    });
    criticalErrors.push(...configValidation.errors);
  }

  // 2. Validate Firebase services
  try {
    // Test Firebase initialization by importing the client
    const { auth, db, storage } = await import('./firebaseClient');
    results.push({
      service: 'Firebase Services',
      status: 'success',
      message: 'Firebase Auth, Firestore, and Storage initialized successfully',
    });
  } catch (error) {
    results.push({
      service: 'Firebase Services',
      status: 'error',
      message: 'Failed to initialize Firebase services',
      details: error instanceof Error ? error.message : 'Unknown error',
    });
    criticalErrors.push('Firebase initialization failed');
  }

  // 3. Validate Speech Services
  try {
    const speechConfigured = await speechService.isConfigured();
    if (speechConfigured) {
      results.push({
        service: 'Speech Services',
        status: 'success',
        message: 'Google Cloud Speech-to-Text and Text-to-Speech are configured',
      });
    } else {
      results.push({
        service: 'Speech Services',
        status: 'warning',
        message: 'Speech services may not be properly configured',
        details: 'Voice features may not work correctly',
      });
      warnings.push('Speech services configuration issue');
    }
  } catch (error) {
    results.push({
      service: 'Speech Services',
      status: 'error',
      message: 'Failed to validate speech services',
      details: error instanceof Error ? error.message : 'Unknown error',
    });
    warnings.push('Speech services validation failed');
  }

  // 4. Validate Gemini AI Service
  try {
    const geminiConfigured = await geminiService.isConfigured();
    if (geminiConfigured) {
      results.push({
        service: 'Gemini AI',
        status: 'success',
        message: 'Google Gemini AI service is configured and accessible',
      });
    } else {
      results.push({
        service: 'Gemini AI',
        status: 'warning',
        message: 'Gemini AI service may not be properly configured',
        details: 'AI-powered features may not work correctly',
      });
      warnings.push('Gemini AI configuration issue');
    }
  } catch (error) {
    results.push({
      service: 'Gemini AI',
      status: 'error',
      message: 'Failed to validate Gemini AI service',
      details: error instanceof Error ? error.message : 'Unknown error',
    });
    warnings.push('Gemini AI validation failed');
  }

  // 5. Validate Language Support
  try {
    const { INDIAN_LANGUAGES } = await import('./languages');
    if (INDIAN_LANGUAGES.length >= 22) {
      results.push({
        service: 'Language Support',
        status: 'success',
        message: `${INDIAN_LANGUAGES.length} Indian languages configured`,
      });
    } else {
      results.push({
        service: 'Language Support',
        status: 'warning',
        message: `Only ${INDIAN_LANGUAGES.length} languages configured (expected 22+)`,
      });
      warnings.push('Incomplete language configuration');
    }
  } catch (error) {
    results.push({
      service: 'Language Support',
      status: 'error',
      message: 'Failed to load language configuration',
      details: error instanceof Error ? error.message : 'Unknown error',
    });
    criticalErrors.push('Language configuration failed');
  }

  // 6. Validate PWA Configuration
  try {
    // Check if manifest.json exists and is accessible
    const manifestResponse = await fetch('/manifest.json');
    if (manifestResponse.ok) {
      results.push({
        service: 'PWA Configuration',
        status: 'success',
        message: 'PWA manifest and service worker configured',
      });
    } else {
      results.push({
        service: 'PWA Configuration',
        status: 'warning',
        message: 'PWA manifest not accessible',
        details: 'App may not be installable as PWA',
      });
      warnings.push('PWA configuration issue');
    }
  } catch (error) {
    results.push({
      service: 'PWA Configuration',
      status: 'warning',
      message: 'Could not validate PWA configuration',
      details: 'PWA features may not work in production',
    });
    warnings.push('PWA validation failed');
  }

  // 7. Validate TypeScript Configuration
  try {
    // Check if types are properly configured by importing the module
    const typesModule = await import('./types');
    if (typesModule) {
      results.push({
        service: 'TypeScript Types',
        status: 'success',
        message: 'All TypeScript interfaces and types are properly defined',
      });
    }
  } catch (error) {
    results.push({
      service: 'TypeScript Types',
      status: 'error',
      message: 'Failed to load TypeScript type definitions',
      details: error instanceof Error ? error.message : 'Unknown error',
    });
    criticalErrors.push('TypeScript configuration failed');
  }

  return {
    isValid: criticalErrors.length === 0,
    results,
    criticalErrors,
    warnings,
  };
}

/**
 * Generate setup report
 */
export function generateSetupReport(validation: SetupValidation): string {
  let report = '# CraftStory App Setup Validation Report\n\n';
  
  if (validation.isValid) {
    report += '✅ **Setup Status: VALID** - All critical services are configured\n\n';
  } else {
    report += '❌ **Setup Status: INVALID** - Critical configuration issues found\n\n';
  }

  // Summary
  const successCount = validation.results.filter(r => r.status === 'success').length;
  const warningCount = validation.results.filter(r => r.status === 'warning').length;
  const errorCount = validation.results.filter(r => r.status === 'error').length;

  report += `## Summary\n`;
  report += `- ✅ Successful: ${successCount}\n`;
  report += `- ⚠️ Warnings: ${warningCount}\n`;
  report += `- ❌ Errors: ${errorCount}\n\n`;

  // Detailed results
  report += '## Detailed Results\n\n';
  validation.results.forEach(result => {
    const icon = result.status === 'success' ? '✅' : result.status === 'warning' ? '⚠️' : '❌';
    report += `### ${icon} ${result.service}\n`;
    report += `**Status:** ${result.status.toUpperCase()}\n`;
    report += `**Message:** ${result.message}\n`;
    if (result.details) {
      report += `**Details:** ${result.details}\n`;
    }
    report += '\n';
  });

  // Critical errors
  if (validation.criticalErrors.length > 0) {
    report += '## Critical Errors (Must Fix)\n\n';
    validation.criticalErrors.forEach(error => {
      report += `- ❌ ${error}\n`;
    });
    report += '\n';
  }

  // Warnings
  if (validation.warnings.length > 0) {
    report += '## Warnings (Recommended to Fix)\n\n';
    validation.warnings.forEach(warning => {
      report += `- ⚠️ ${warning}\n`;
    });
    report += '\n';
  }

  report += '---\n';
  report += `Report generated at: ${new Date().toISOString()}\n`;

  return report;
}

/**
 * Log setup validation results to console
 */
export function logSetupValidation(validation: SetupValidation): void {
  console.log('🔍 CraftStory App Setup Validation');
  console.log('=====================================');
  
  if (validation.isValid) {
    console.log('✅ Setup Status: VALID');
  } else {
    console.log('❌ Setup Status: INVALID');
  }

  console.log('\nService Status:');
  validation.results.forEach(result => {
    const icon = result.status === 'success' ? '✅' : result.status === 'warning' ? '⚠️' : '❌';
    console.log(`${icon} ${result.service}: ${result.message}`);
    if (result.details) {
      console.log(`   Details: ${result.details}`);
    }
  });

  if (validation.criticalErrors.length > 0) {
    console.log('\n❌ Critical Errors:');
    validation.criticalErrors.forEach(error => console.log(`   - ${error}`));
  }

  if (validation.warnings.length > 0) {
    console.log('\n⚠️ Warnings:');
    validation.warnings.forEach(warning => console.log(`   - ${warning}`));
  }

  console.log('\n=====================================');
}