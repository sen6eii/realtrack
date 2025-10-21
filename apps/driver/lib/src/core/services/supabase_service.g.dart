// This file is used by the build system to generate the code for the Riverpod providers.
// Run `dart run build_runner build` to generate the necessary files.

// GENERATED CODE - DO NOT MODIFY BY HAND

part of 'supabase_service.dart';

// **************************************************************************
// RiverpodGenerator
// **************************************************************************

// ignore_for_file: type=lint
// ignore_for_file: unused_element, deprecated_member_use, deprecated_member_use_from_same_package, use_function_type_syntax_for_parameters, unnecessary_const, avoid_init_to_null, invalid_override_different_default_values_named, prefer_expression_function_bodies, annotate_overrides, invalid_annotation_target, unnecessary_question_mark

String _$supabaseServiceHash() => r'5d1c2e5f3a7b8c9d0e1f2a3b4c5d6e7f8a9b0c1d2e3f4a5b6c7d8e9f0a1b2c3';

/// See also [SupabaseService].
@ProviderFor(SupabaseService)
final supabaseServiceProvider = AutoDisposeProvider<SupabaseService>.internal(
  name: r'supabaseServiceProvider',
  type: SupabaseService,
  debugGetCreateSourceHash: const bool.fromEnvironment('dart.vm.product')
      ? null
      : _$supabaseServiceHash,
  create: (ref) => SupabaseService(),
  update: (ref, previous) => previous!,
  dependencies: null,
  allTransitiveDependencies: null,
);

typedef SupabaseServiceRef = AutoDisposeProviderRef<SupabaseService>;