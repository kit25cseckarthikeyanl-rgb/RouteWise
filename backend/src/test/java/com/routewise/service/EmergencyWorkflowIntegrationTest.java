package com.routewise.service;

import com.routewise.dto.CreateEmergencyRequest;
import com.routewise.dto.EmergencyDto;
import com.routewise.dto.EmergencyOfferDto;
import com.routewise.entity.EmergencyOffer;
import com.routewise.entity.EmergencyRequest;
import com.routewise.entity.Enums;
import com.routewise.entity.User;
import com.routewise.exception.BusinessException;
import com.routewise.repository.EmergencyAssignmentRepository;
import com.routewise.repository.EmergencyOfferRepository;
import com.routewise.repository.EmergencyRequestRepository;
import com.routewise.repository.UserRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

import static org.junit.jupiter.api.Assertions.*;

@SpringBootTest
@ActiveProfiles("test")
@Transactional
class EmergencyWorkflowIntegrationTest {

    @Autowired
    private EmergencyService emergencyService;

    @Autowired
    private EmergencyOfferService emergencyOfferService;

    @Autowired
    private EmergencyOfferRepository offerRepository;

    @Autowired
    private EmergencyRequestRepository emergencyRepository;

    @Autowired
    private EmergencyAssignmentRepository assignmentRepository;

    @Autowired
    private UserRepository userRepository;

    private User citizenUser;
    private User ambulanceDriverUser;
    private User fireDriverUser;
    private User policeDriverUser;
    private User otherDriverUser;

    @BeforeEach
    void setUp() {
        citizenUser = userRepository.findByEmail("citizen@routewise.demo").orElseThrow();
        ambulanceDriverUser = userRepository.findByEmail("driver1@routewise.demo").orElseThrow();
        fireDriverUser = userRepository.findByEmail("fire1@routewise.demo").orElseThrow();
        policeDriverUser = userRepository.findByEmail("police1@routewise.demo").orElseThrow();
        otherDriverUser = userRepository.findByEmail("driver2@routewise.demo").orElseThrow();
    }

    @Test
    @DisplayName("TEST 1-3: Medical emergency dispatches to available Ambulance responder")
    void medicalEmergencyDispatchesToAmbulanceDriver() {
        CreateEmergencyRequest request = new CreateEmergencyRequest();
        request.setEmergencyType(Enums.EmergencyType.MEDICAL);
        request.setPriority(Enums.Priority.HIGH);
        request.setCitizenName("John Doe");
        request.setContactNumber("+91-9876543210");
        request.setLatitude(11.1085);
        request.setLongitude(77.3411);
        request.setReadableAddress("Tiruppur Center");
        request.setDescription("Severe chest pain medical emergency");

        EmergencyDto emergency = emergencyService.createEmergency(citizenUser.getId(), request);
        assertNotNull(emergency);
        assertNotNull(emergency.getId());

        List<EmergencyOffer> offers = offerRepository.findByEmergencyId(emergency.getId());
        assertFalse(offers.isEmpty(), "An offer must be created for the medical emergency");

        EmergencyOffer activeOffer = offers.get(0);
        assertEquals(Enums.OfferStatus.PENDING, activeOffer.getStatus());
        assertEquals(Enums.ResponderType.AMBULANCE, activeOffer.getResponderType());
        assertNotNull(activeOffer.getDriverUserId());
    }

    @Test
    @DisplayName("TEST 12 & 14: Fire emergency dispatches exclusively to Fire responder")
    void fireEmergencyDispatchesToFireResponder() {
        CreateEmergencyRequest request = new CreateEmergencyRequest();
        request.setEmergencyType(Enums.EmergencyType.FIRE);
        request.setPriority(Enums.Priority.HIGH);
        request.setCitizenName("Jane Fire");
        request.setContactNumber("+91-9876543211");
        request.setLatitude(11.1090);
        request.setLongitude(77.3420);
        request.setReadableAddress("Market Street");
        request.setDescription("Building fire detected");

        EmergencyDto emergency = emergencyService.createEmergency(citizenUser.getId(), request);
        assertNotNull(emergency);

        List<EmergencyOffer> offers = offerRepository.findByEmergencyId(emergency.getId());
        assertFalse(offers.isEmpty());

        EmergencyOffer activeOffer = offers.get(0);
        assertEquals(Enums.OfferStatus.PENDING, activeOffer.getStatus());
        assertEquals(Enums.ResponderType.FIRE_ENGINE, activeOffer.getResponderType(),
                "Fire emergency must only dispatch to FIRE_ENGINE");
        assertNotEquals(Enums.ResponderType.AMBULANCE, activeOffer.getResponderType());
        assertNotEquals(Enums.ResponderType.POLICE, activeOffer.getResponderType());
    }

    @Test
    @DisplayName("TEST 13 & 14: Police emergency dispatches exclusively to Police responder")
    void policeEmergencyDispatchesToPoliceResponder() {
        CreateEmergencyRequest request = new CreateEmergencyRequest();
        request.setEmergencyType(Enums.EmergencyType.POLICE);
        request.setPriority(Enums.Priority.HIGH);
        request.setCitizenName("Mark Police");
        request.setContactNumber("+91-9876543212");
        request.setLatitude(11.1070);
        request.setLongitude(77.3400);
        request.setReadableAddress("Bank Street");
        request.setDescription("Burglary in progress");

        EmergencyDto emergency = emergencyService.createEmergency(citizenUser.getId(), request);
        assertNotNull(emergency);

        List<EmergencyOffer> offers = offerRepository.findByEmergencyId(emergency.getId());
        assertFalse(offers.isEmpty());

        EmergencyOffer activeOffer = offers.get(0);
        assertEquals(Enums.OfferStatus.PENDING, activeOffer.getStatus());
        assertEquals(Enums.ResponderType.POLICE, activeOffer.getResponderType(),
                "Police emergency must only dispatch to POLICE");
        assertNotEquals(Enums.ResponderType.AMBULANCE, activeOffer.getResponderType());
        assertNotEquals(Enums.ResponderType.FIRE_ENGINE, activeOffer.getResponderType());
    }

    @Test
    @DisplayName("TEST 15: Unauthorized user cannot accept another responder's offer")
    void unauthorizedUserCannotAcceptOffer() {
        CreateEmergencyRequest request = new CreateEmergencyRequest();
        request.setEmergencyType(Enums.EmergencyType.MEDICAL);
        request.setPriority(Enums.Priority.HIGH);
        request.setLatitude(11.1085);
        request.setLongitude(77.3411);

        EmergencyDto emergency = emergencyService.createEmergency(citizenUser.getId(), request);
        List<EmergencyOffer> offers = offerRepository.findByEmergencyId(emergency.getId());
        EmergencyOffer offer = offers.get(0);

        Long correctDriverId = offer.getDriverUserId();
        Long wrongDriverId = correctDriverId.equals(ambulanceDriverUser.getId())
                ? otherDriverUser.getId()
                : ambulanceDriverUser.getId();

        assertThrows(com.routewise.exception.UnauthorizedException.class, () ->
                emergencyOfferService.acceptOffer(offer.getId(), wrongDriverId),
                "Should throw UnauthorizedException when wrong driver attempts to accept"
        );
    }

    @Test
    @DisplayName("TEST 5 & 16: Eligible responder accepts offer and assigns atomically; duplicate accept is prevented")
    void responderCanAcceptOfferAtomicallyAndDuplicateIsPrevented() {
        CreateEmergencyRequest request = new CreateEmergencyRequest();
        request.setEmergencyType(Enums.EmergencyType.MEDICAL);
        request.setPriority(Enums.Priority.HIGH);
        request.setLatitude(11.1085);
        request.setLongitude(77.3411);

        EmergencyDto emergencyDto = emergencyService.createEmergency(citizenUser.getId(), request);
        List<EmergencyOffer> offers = offerRepository.findByEmergencyId(emergencyDto.getId());
        EmergencyOffer offer = offers.get(0);

        EmergencyOfferDto accepted = emergencyOfferService.acceptOffer(offer.getId(), offer.getDriverUserId());
        assertNotNull(accepted);
        assertEquals("ACCEPTED", accepted.getStatus());

        EmergencyRequest updatedEmergency = emergencyRepository.findById(emergencyDto.getId()).orElseThrow();
        assertEquals(Enums.EmergencyStatus.ASSIGNED, updatedEmergency.getStatus());

        // Check assignment was created
        List<com.routewise.entity.EmergencyAssignment> assignments = assignmentRepository.findByEmergencyId(emergencyDto.getId());
        assertFalse(assignments.isEmpty(), "Assignment record should exist for emergency");
        assertEquals(offer.getResponderId(), assignments.get(0).getAmbulanceId());

        // Duplicate acceptance attempt must fail
        assertThrows(BusinessException.class, () ->
                emergencyOfferService.acceptOffer(offer.getId(), offer.getDriverUserId()),
                "Duplicate acceptance must be rejected with BusinessException"
        );
    }

    @Test
    @DisplayName("TEST 9: Declining an offer reassigns to the next available responder")
    void declineOfferReassignsToNextResponder() {
        CreateEmergencyRequest request = new CreateEmergencyRequest();
        request.setEmergencyType(Enums.EmergencyType.MEDICAL);
        request.setPriority(Enums.Priority.HIGH);
        request.setLatitude(11.1085);
        request.setLongitude(77.3411);

        EmergencyDto emergencyDto = emergencyService.createEmergency(citizenUser.getId(), request);
        List<EmergencyOffer> offers = offerRepository.findByEmergencyId(emergencyDto.getId());
        EmergencyOffer firstOffer = offers.get(0);

        // Decline the first offer
        emergencyOfferService.declineOffer(firstOffer.getId(), firstOffer.getDriverUserId(), "Busy with maintenance");

        EmergencyOffer declinedOffer = offerRepository.findById(firstOffer.getId()).orElseThrow();
        assertEquals(Enums.OfferStatus.DECLINED, declinedOffer.getStatus());

        // Check if next offer is created
        List<EmergencyOffer> allOffers = offerRepository.findByEmergencyId(emergencyDto.getId());
        assertTrue(allOffers.size() >= 2, "Automatic reassignment should create a new offer for the next unit");

        EmergencyOffer secondOffer = allOffers.stream()
                .filter(o -> !o.getId().equals(firstOffer.getId()))
                .findFirst().orElseThrow();
        assertEquals(Enums.OfferStatus.PENDING, secondOffer.getStatus());
        assertNotEquals(firstOffer.getResponderId(), secondOffer.getResponderId(),
                "Next offer must be for a different responder unit");
    }
}
