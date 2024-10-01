/**
 * @NApiVersion 2.x
 * @NScriptType Restlet
 * @NModuleScope SameAccount
 */

define(['N/record', 'N/search', 'N/runtime'], function(record, search, runtime) {
    
    function updateTags( data ) {
        var failedItemsList = [],
            governanceThreshold = 300;

        for ( var i = 0; i < data.length; ++i ) {

            // Check the remaining governance units
            if ( runtime.getCurrentScript().getRemainingUsage() < governanceThreshold ) {
                return {
                    success: false,
                    message: 'Governance limit reached',
                    remainingItems: data.slice(i),
                    failedItemsList: failedItemsList
                };
            }

            var status = updateItemRecord( data[ i ] );

            if ( status.success ) {
                continue;
            }

            failedItemsList.push( status );
        }

        return {
            success: ! failedItemsList.length,
            failedItemsList: failedItemsList
        };
    }

    function updateItemRecord( data ) {
        try {
            var itemId = data.itemId || 0,
                tags = data.tags || [];

            if ( ! parseInt( itemId ) || 'object' !== typeof tags || ! tags.length ) {
                throw new Error('Invalid Item tags data')
            }

            var itemRecord = record.load({
                    type: record.Type.INVENTORY_ITEM,
                    id: itemId
                }),
                //existingTags = itemRecord.getValue({ fieldId: 'custitemai_generated_tags' }) || [],
                existingTags = [],
                customRecordIds = searchCustomRecords( tags );

            tags.forEach( function( tag ) {
                var customRecordId = customRecordIds[ tag ] || false;

                if ( ! customRecordId ) {
                    customRecordId = createCustomRecord( tag );
                }

                existingTags.push( customRecordId );
            });

            itemRecord.setValue({
                fieldId: 'custitemai_generated_tags',
                value: existingTags
            });

            itemRecord.save();
            return {
                success: true,
                itemId: itemId
            };

        } catch (e) {
            log.error({
                title: 'Error Updating Tags',
                details: e
            });

            return data;
        }
    }

    function searchCustomRecords(tags) {
        var customRecordIds = {},
            customRecordSearch = search.create({
                type: 'customrecord_toynk_ai_generated_tags',
                columns: ['internalid', 'name'],
                filters: [
                    ['name', search.Operator.ANY, tags]
                ]
            }),
            searchResults = customRecordSearch.run().getRange({ start: 0, end: 1000 });

        searchResults.forEach( function(result) {
            var internalId = result.getValue({ name: 'internalid' }),
                tagName = result.getValue({ name: 'name' });

            customRecordIds[ tagName ] = internalId;

            return true;
        });

        return customRecordIds;
    }

    function createCustomRecord( tag ) {
        var tagRecord = record.create({
            type: 'customrecord_toynk_ai_generated_tags',
            isDynamic: true
        });

        tagRecord.setValue({ fieldId: 'name', value: tag })

        return tagRecord.save();
    }

    return {
        post: function post( context ) {
            if ( ! context.hasOwnProperty('data') || 'object' !== typeof context ) {
                return {
                    success: false,
                    message: 'The data object is required'
                };
            }

            return updateTags( context.data );
        }
    };

});

