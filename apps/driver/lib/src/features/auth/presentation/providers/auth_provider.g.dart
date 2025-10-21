// GENERATED CODE - DO NOT MODIFY BY HAND

part of 'auth_provider.dart';

// **************************************************************************
// RiverpodGenerator
// **************************************************************************

String _$authProviderHash() => r'c3d4e5f6789012345678901234567890abcdef12';

/// See also [AuthProvider].
@ProviderFor(AuthProvider)
final authProvider = AsyncNotifierProvider<AuthProvider, User?>.internal(
  name: r'authProvider',
  type: AsyncNotifierProvider<AuthProvider, User?>,
  debugGetCreateSourceHash: const bool.fromEnvironment('dart.vm.product')
      ? null
      : _$authProviderHash,
  create: (ref) => AuthProvider(),
);

typedef AuthProviderRef = AsyncNotifierProviderRef<User?>;

// ignore_for_file: type=lint
// ignore_for_file: unused_element, deprecated_member_use, deprecated_member_use_from_same_package, use_function_type_syntax_for_parameters, unnecessary_const, avoid_init_to_null, invalid_override_different_default_values_named, prefer_expression_function_bodies, annotate_overrides, invalid_annotation_target, unnecessary_question_mark