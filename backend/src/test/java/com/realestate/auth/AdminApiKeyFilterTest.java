package com.realestate.auth;

import jakarta.servlet.ServletException;
import java.io.IOException;
import org.junit.jupiter.api.Test;
import org.springframework.mock.web.MockFilterChain;
import org.springframework.mock.web.MockHttpServletRequest;
import org.springframework.mock.web.MockHttpServletResponse;
import org.springframework.test.util.ReflectionTestUtils;

import static org.assertj.core.api.Assertions.assertThat;

class AdminApiKeyFilterTest {

    @Test
    void adminRequestWithoutConfiguredKey_returnsServiceUnavailable() throws ServletException, IOException {
        AdminApiKeyFilter filter = new AdminApiKeyFilter();
        MockHttpServletRequest request = adminRequest();
        MockHttpServletResponse response = new MockHttpServletResponse();

        filter.doFilter(request, response, new MockFilterChain());

        assertThat(response.getStatus()).isEqualTo(503);
    }

    @Test
    void adminRequestWithWrongKey_returnsUnauthorized() throws ServletException, IOException {
        AdminApiKeyFilter filter = new AdminApiKeyFilter();
        ReflectionTestUtils.setField(filter, "expectedApiKey", "server-key");
        MockHttpServletRequest request = adminRequest();
        request.addHeader("X-Admin-Api-Key", "wrong-key");
        MockHttpServletResponse response = new MockHttpServletResponse();

        filter.doFilter(request, response, new MockFilterChain());

        assertThat(response.getStatus()).isEqualTo(401);
    }

    @Test
    void adminRequestWithCorrectKey_continuesChain() throws ServletException, IOException {
        AdminApiKeyFilter filter = new AdminApiKeyFilter();
        ReflectionTestUtils.setField(filter, "expectedApiKey", "server-key");
        MockHttpServletRequest request = adminRequest();
        request.addHeader("X-Admin-Api-Key", "server-key");
        MockHttpServletResponse response = new MockHttpServletResponse();

        filter.doFilter(request, response, new MockFilterChain());

        assertThat(response.getStatus()).isEqualTo(200);
    }

    @Test
    void nonAdminRequest_doesNotRequireKey() throws ServletException, IOException {
        AdminApiKeyFilter filter = new AdminApiKeyFilter();
        MockHttpServletRequest request = new MockHttpServletRequest("GET", "/api/v1/apartments/search");
        request.setServletPath("/api/v1/apartments/search");
        MockHttpServletResponse response = new MockHttpServletResponse();

        filter.doFilter(request, response, new MockFilterChain());

        assertThat(response.getStatus()).isEqualTo(200);
    }

    private MockHttpServletRequest adminRequest() {
        MockHttpServletRequest request = new MockHttpServletRequest("POST", "/api/v1/admin/collect");
        request.setServletPath("/api/v1/admin/collect");
        return request;
    }
}
