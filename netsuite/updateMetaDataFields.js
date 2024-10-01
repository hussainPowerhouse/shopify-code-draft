/**
 * @NApiVersion 2.x
 * @NScriptType Restlet
 */
define(['N/record', 'N/search', 'N/log'], function (record, search, log) {
    function post(requestBody) {
        try {
            // Fields that require fetching internal IDs for select options
            var selectFields = [
                'custitem_tt_condition',
                'custitem_tt_gender',
                'custitem_tt_main_category',
                'custitem17',
                'custitem_tt_colordesc',
                'custitem_tt_brand'
            ];

            // Assuming the JSON structure is { itemId: "ID", attributes: { key: value, ... } }
            var itemId = requestBody.itemId;
            var attributes = requestBody.attributes;

            // Load the item record using its internal ID
            var itemRecord;
            try {
                itemRecord = record.load({
                    type: record.Type.INVENTORY_ITEM, // Change to the appropriate item type if needed
                    id: itemId,
                    isDynamic: true
                });
            } catch (e) {
                log.debug('Record Load Error', 'Error loading item record with ID: ' + itemId + '. Message: ' + e.message);
                return { success: false, error: 'Item not found: ' + e.message };
            }

            // Iterate through the attributes and update the item record
            for (var attributeId in attributes) {
               if (attributes.hasOwnProperty(attributeId) && typeof attributes[attributeId] !== 'undefined' && attributes[attributeId]) {
                    var value = attributes[attributeId];
                    try {
                        if (selectFields.indexOf(attributeId) > -1) {
                            // Fetch the internal ID for select fields
                            var internalId = getSelectOptionId(attributeId, value);
                            if (internalId) {
                                itemRecord.setValue({
                                    fieldId: attributeId,
                                    value: internalId
                                });
                            } else {
                                log.error('Invalid Option', 'Invalid select option for field: ' + attributeId + ' with value: ' + value);
                                continue; // Skip this attribute and proceed with the next one
                            }
                        } else {
                            // Generic handling for other fields
                            itemRecord.setValue({
                                fieldId: attributeId,
                                value: value
                            });
                        }
                    } catch (e) {
                        log.debug('Error Setting Field Value', 'Failed to set value for field: ' + attributeId + '. Message: ' + e.message);
                        continue; // Skip to the next attribute
                    }
                }
            }

            // Save the updated item record
            var updatedItemId;
            try {
                updatedItemId = itemRecord.save();
            } catch (e) {
                log.debug('Record Save Error', 'Error saving item record with ID: ' + itemId + '. Message: ' + e.message);
                return { success: false, error: 'Error saving record: ' + e.message };
            }

            return {
                success: true,
                itemId: updatedItemId,
                message: 'Record updated successfully'
            };
        } catch (e) {
            log.debug('Unexpected Error', 'Unexpected error occurred. Message: ' + e.message);
            return { success: false, error: 'Unexpected error: ' + e.message };
        }
    }

    /**
     * Helper function to get the internal ID of a select option based on its label
     */
    function getSelectOptionId(fieldId, label) {
        try {
            // Mapping of field IDs to their respective custom list internal IDs
            var listMapper = {
                custitem_tt_condition: 'customlist_condition_list',
                custitem_tt_gender: 'customlist_tt_gender_list',
                custitem_tt_main_category: 'customlistmain_categories',
                custitem17: 'customlist949',
                custitem_tt_colordesc: 'customlist_tt_color',
                custitem_tt_brand: 'customlist_tt_brand_list'
            };

            // Retrieve the list type based on the fieldId
            var listType = listMapper[fieldId];
            log.debug('listType',listType);
            if (!listType) {
                log.error('List Type Not Found', 'No custom list found for field: ' + fieldId);
                return null; // Skip if the fieldId is not mapped
            }

            // Search for the internal ID of the select option based on the label
            var searchResult = search.create({
                type: listType,
                filters: [['name', 'is', label]],
                columns: ['internalid']
            }).run().getRange({ start: 0, end: 1 });

            if (searchResult.length > 0) {
                return searchResult[0].getValue('internalid');
            } else {
                log.error('Option Not Found', 'No matching option found for label: ' + label + ' in list: ' + listType);
                return null; // Return null if no matching option is found
            }
        } catch (e) {
            log.debug('Error Fetching Internal ID', 'Field: ' + fieldId + ', Label: ' + label + '. Message: ' + e.message);
            return null; // Skip if there is an error in fetching the internal ID
        }
    }

    return {
        post: post
    };
});

