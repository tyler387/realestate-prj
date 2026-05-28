package com.realestate.web.controller;

/*
 * 존재 이유:
 * - WebMvcTest에서 컨트롤러의 HTTP 입출력만 검증할 수 있도록 테스트 전용 보안 설정을 제공한다.
 *
 * 왜 필요한가:
 * - 실제 SecurityConfig/JWT 필터까지 함께 타면 컨트롤러 테스트가 인증 설정에 묶여 의도가 흐려진다.
 * - 이 설정은 CSRF를 끄고 모든 요청을 허용해, 테스트가 "요청 매핑/응답 형식/서비스 호출"에 집중하게 한다.
 *
 * 어떻게 쓰는가:
 * - 컨트롤러 테스트 클래스에서 `@Import(TestSecurityConfig.class)`로 가져온다.
 * - 운영 코드에서는 사용되지 않고 test source set에서만 컴파일된다.
 *
 * 막는 장애:
 * - 컨트롤러 응답 변경을 확인하려는 테스트가 보안 필터 때문에 401/403으로 실패하는 문제
 * - 테스트마다 보안 우회 설정을 중복 작성해 설정이 흩어지는 문제
 */

import org.springframework.boot.test.context.TestConfiguration;
import org.springframework.context.annotation.Bean;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.web.SecurityFilterChain;

@TestConfiguration
class TestSecurityConfig {

    @Bean
    SecurityFilterChain testFilterChain(HttpSecurity http) throws Exception {
        http.csrf(csrf -> csrf.disable());
        http.authorizeHttpRequests(auth -> auth.anyRequest().permitAll());
        return http.build();
    }
}
